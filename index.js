const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Allow CORS for a single domain
const FRONTEND_URL = 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL];
app.use(cors({
  origin: (origin, callback) => {
    console.log(origin);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// We'll use an array to store the products
let products = [];

// Middleware to parse JSON in request body
app.use(express.json());

// Route to get all products
app.get('/products', (req, res) => {
  res.send(products);
});

app.post('/products', upload.single('file'), async (req, res) => {
  // req.file contains the uploaded file
  // req.body contains the additional data in the request
  // Handle the request here

  const { name, description } = req.body;
  const file = req.file;
  if (!file) return res.status(500).send('no file');

  // Save file to server
  if (!(['image/jpeg', 'image/png'].includes(file.mimetype))) {
    return res.status(500).send('bad mime type');
  }
  const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const filename = `${file.filename}.${extension}`;
  const filePath = `uploads/${filename}`; // the filename property is added by Multer
  fs.renameSync(file.path, filePath);

  const newProduct = { id: products.length, name, description, productImageURL: filename };
  products.push(newProduct);

  return res.status(200).json({ message: 'File uploaded successfully.' });
});

// Route to update a product by ID
app.put('/products/:id', upload.single('file'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(product => product.id === productId);
  if (productIndex === -1) {
    return res.sendStatus(404);
  } else {
    const { name, description } = req.body;
    const file = req.file;

    if (file === undefined) {
      const updatedProduct = { ...products[productIndex], name, description };
      products[productIndex] = updatedProduct;
      return res.send(updatedProduct);
    }

    // Save file to server
    if (!(['image/jpeg', 'image/png'].includes(file.mimetype))) return res.status(500).send('bad mime type');
    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${file.filename}.${extension}`;
    const filePath = `uploads/${filename}`; // the filename property is added by Multer
    fs.renameSync(file.path, filePath);
    const oldImagePath = `uploads/${products[productIndex].productImageURL}`;
    if (fs.existsSync(oldImagePath)) {
      fs.rmSync(oldImagePath);
      console.log('removed:', oldImagePath);
    }

    const updatedProduct = { ...products[productIndex], name, description, productImageURL: filename };
    products[productIndex] = updatedProduct;
    return res.send(updatedProduct);
  }
});

// Route to delete a product by ID
app.delete('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(product => product.id === productId);
  if (productIndex === -1) {
    res.sendStatus(404);
  } else {
    products.splice(productIndex, 1);
    res.sendStatus(204);
  }
});

// Start the server
app.listen(5000, () => {
  console.log('Server listening on port 5000');
});