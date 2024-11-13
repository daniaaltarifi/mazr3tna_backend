const db = require("../config.js");
const addCertificate = async (req, res) => {
  const { certificate_name } = req.body;
  const certificate_img =
    req.files && req.files["certificate_img"]
      ? req.files["certificate_img"][0].filename
      : null;
  const addCertificateQuery = `INSERT INTO certificate(certificate_name, certificate_img) VALUES(?, ?)`;
  db.query(addCertificateQuery, [certificate_name, certificate_img], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "certificate added successfully" });
  });
};

const getAllCertificates = async (req, res) => {
  const getBrand = `SELECT * FROM certificate`;
  db.query(getBrand, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};


const getCertificateById = async (req, res) => {
  const { id } = req.params;
  const getCertificate = `SELECT * FROM certificate WHERE id =?`;
  db.query(getCertificate, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
}

const getSeasons = (req, res) => {
  const seasons = "SELECT DISTINCT season FROM product";
  db.query(seasons, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const getProductBySeasons = (req, res) => {
  const { season } = req.params;
  const getProduct = `
        SELECT p.id, p.name, p.sale, p.instock, MIN(pi.img) AS first_image, v.before_price, v.after_price
        FROM product p
         JOIN product_images pi ON p.id = pi.ProductID
    LEFT JOIN variants v ON p.id = v.Product_ID
     WHERE p.season =? GROUP BY p.id`;
  db.query(getProduct, [season], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

const getLatestProduct = async (req, res) => {
  const getLatestProduct = `
    SELECT p.id, p.name, p.sale, p.instock, MIN(pi.img) AS first_image,v.before_price, v.after_price
        FROM product p
         JOIN product_images pi ON p.id = pi.ProductID
  LEFT JOIN variants v ON p.id = v.Product_ID
  GROUP BY p.id
  ORDER BY p.updated_at DESC
    LIMIT 8;
`;
  db.query(getLatestProduct, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const updateCertificate = async (req, res) => {
  const { id } = req.params;
  const { certificate_name } = req.body;
  const certificate_img =
    req.files && req.files["certificate_img"]
      ? req.files["certificate_img"][0].filename
      : null;

  const sqlSelect = "SELECT certificate_name, certificate_img FROM certificate WHERE id = ?";

  db.query(sqlSelect, [id], (err, results) => {
    if (err) {
      console.error("Error fetching current data:", err);
      return res.status(500).json({ message: err.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching record found to update" });
    }
    const existing = results[0];
    const updatedcertificate_name =
      certificate_name !== undefined ? certificate_name : existing.certificate_name;

    const updatedcertificate_Img =
    certificate_img !== null ? certificate_img : existing.certificate_img;
    const updateBrandQuery = `UPDATE certificate SET certificate_name =?, certificate_img =? WHERE id =?`;
    db.query(
      updateBrandQuery,
      [updatedcertificate_name, updatedcertificate_Img, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "certificate updated successfully" });
      }
    );
  });
};

const deleteCertificate = async (req, res) => {
  const { id } = req.params;
  const deleteCertificateQuery = `DELETE FROM certificate WHERE id =?`;
  db.query(deleteCertificateQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "certificate deleted successfully" });
  });
};
module.exports = {
  addCertificate,
  getAllCertificates,
  updateCertificate,
  deleteCertificate,
  getCertificateById,
  // GET SEASONS
  getSeasons,
  getProductBySeasons,
  //GET ALL PRODUCT
  // getAllProducts,
  getLatestProduct,
};
