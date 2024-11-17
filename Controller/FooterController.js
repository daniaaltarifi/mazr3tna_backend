const db = require("../config.js");

const getfooter = async (req, res) => {
    const getfooterQuery = `SELECT * FROM footer`;
    db.query(getfooterQuery, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };
  const updatefooter = async (req, res) => {
    const { id } = req.params;
    const { email, phone } = req.body;
    const logo =
      req.files && req.files["logo"] ? req.files["logo"][0].filename : null;
    // First, retrieve the current values
    const sqlSelect = "SELECT email, phone, logo FROM footer WHERE id = ?";
  
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
      // Update fields only if new values are provided
      const updatedemail = email !== undefined ? email : existing.email;
      const updatedphone = phone !== undefined ? phone : existing.phone;
      const updatedlogo = logo !== null ? logo : existing.logo;
  
      const updatefooterQuery = `UPDATE footer SET email=?, phone=?, logo=? WHERE id=?`;
      db.query(
        updatefooterQuery,
        [updatedemail, updatedphone, updatedlogo, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "footer updated successfully" });
        }
      );
    });
  };

const getfooterById = async (req, res) => {
  const { id } = req.params;

  // Corrected query syntax
  const getfooterQuery = `
    SELECT *
    FROM footer 
    WHERE id = ?`;

  db.query(getfooterQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Send the result as JSON response
    res.json(result[0]);
  });
}

module.exports={getfooter,updatefooter,getfooterById}