const db = require("../config.js");
const addblogs = async (req, res) => {
  const { title,description } = req.body;
  const img =
    req.files && req.files["img"]
      ? req.files["img"][0].filename
      : null;
  const addblogsQuery = `INSERT INTO blogs(title,description, img) VALUES(?, ?, ?)`;
  db.query(addblogsQuery, [title,description, img], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "blogs added successfully" });
  });
};

const getAllblogs = async (req, res) => {
  const getblogs = `SELECT * FROM blogs`;
  db.query(getblogs, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};


const getblogsById = async (req, res) => {
  const { id } = req.params;
  const getblogs = `SELECT * FROM blogs WHERE id =?`;
  db.query(getblogs, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
}


const updateblogs = async (req, res) => {
  const { id } = req.params;
  const { title,description } = req.body;
  const img =
    req.files && req.files["img"]
      ? req.files["img"][0].filename
      : null;

  const sqlSelect = "SELECT title,description, img FROM blogs WHERE id = ?";

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
    const updatedtitle=
      title !== undefined ? title: existing.title;
      const updatedDescription=
      description !== undefined ? description: existing.description;
    const updatedimg =
    img !== null ? img : existing.img;
    const updateBrandQuery = `UPDATE blogs SET title =?, description =?, img =? WHERE id =?`;
    db.query(
      updateBrandQuery,
      [updatedtitle,updatedDescription, updatedimg, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "blogs updated successfully" });
      }
    );
  });
};

const deleteblogs = async (req, res) => {
  const { id } = req.params;
  const deleteblogsQuery = `DELETE FROM blogs WHERE id =?`;
  db.query(deleteblogsQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "blogs deleted successfully" });
  });
};
module.exports = {
  addblogs,
  getAllblogs,
  updateblogs,
  deleteblogs,
  getblogsById,

};
