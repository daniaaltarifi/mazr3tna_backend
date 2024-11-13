const db = require("../config.js");

const getmain_product = async (req, res) => {
  const query = `SELECT * FROM main_products`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .json({ error: "Database query error: " + err.message });
    }
    res.status(200).json(results);
  });
};
const addMainProduct = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }
  const addQuery = `INSERT INTO main_products (name) VALUES (?)`;
  db.query(addQuery, [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Main product added successfully" });
  });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Id is required." });
  }
  const deleteQuery = `DELETE FROM main_products WHERE id =?`;
  db.query(deleteQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Main product deleted successfully" });
  });
};

const filter_main_products = async (req, res) => {
  const { main_product_type_id } = req.params;
  console.log('main_product_type_id:', main_product_type_id);  // Debugging line
  
  if (!main_product_type_id) {
    return res.status(400).json({ error: "Main product type ID is required." });
  }

  const filterQuery = `
      SELECT 
        p.id AS id,
        p.name AS name, 
        p.sale AS sale, 
        p.instock AS instock, 
        p.sourcing AS sourcing,
        v.before_price, 
        v.after_price, 
        MIN(pi.img) AS first_image  
      FROM product p
      LEFT JOIN variants v ON v.product_ID = p.id
      LEFT JOIN product_images pi ON p.id = pi.ProductID
      WHERE p.main_product_type_id = ?
      GROUP BY p.id`;

  // Use db.query with parameterized query to avoid SQL injection
  db.query(filterQuery, [main_product_type_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log('Results:', results);  // Debugging line to check the output
    res.status(200).json(results);
  });
};

module.exports = {
  getmain_product,
  addMainProduct,
  deleteProduct,
  filter_main_products,
};
