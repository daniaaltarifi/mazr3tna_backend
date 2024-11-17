const db = require("../config.js");
const addsocial= async (req, res) => {
  const { link_to } = req.body;
  const icon =
    req.files && req.files["icon"]
      ? req.files["icon"][0].filename
      : null;
  const addsocialQuery = `INSERT INTO social(link_to, icon) VALUES(?, ?)`;
  db.query(addsocialQuery, [link_to, icon], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "social added successfully" });
  });
};

const getAllsocial= async (req, res) => {
  const getsocial= `SELECT * FROM social`;
  db.query(getsocial, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};


const getsocialById = async (req, res) => {
  const { id } = req.params;
  const getsocial= `SELECT * FROM social WHERE id =?`;
  db.query(getsocial, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
}


const updatesocial= async (req, res) => {
  const { id } = req.params;
  const { link_to } = req.body;
  const icon =
    req.files && req.files["icon"]
      ? req.files["icon"][0].filename
      : null;

  const sqlSelect = "SELECT link_to, icon FROM social WHERE id = ?";

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
    const updatedlink_to=
      link_to !== undefined ? link_to: existing.link_to;
    const updatedicon =
    icon !== null ? icon : existing.icon;
    const updateBrandQuery = `UPDATE social SET link_to =?, icon =? WHERE id =?`;
    db.query(
      updateBrandQuery,
      [updatedlink_to, updatedicon, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "social updated successfully" });
      }
    );
  });
};

const deletesocial= async (req, res) => {
  const { id } = req.params;
  const deletesocialQuery = `DELETE FROM social WHERE id =?`;
  db.query(deletesocialQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "social deleted successfully" });
  });
};
module.exports = {
  addsocial,
  getAllsocial,
  updatesocial,
  deletesocial,
  getsocialById,

};
