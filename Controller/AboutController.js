const db = require("../config.js");


const addAbout = async (req, res) => {
    const { title,description} = req.body;
    const img =
      req.files && req.files["img"]
        ? req.files["img"][0].filename
        : null;
    const addAboutQuery = `INSERT INTO about(title,description,img) VALUES(?, ?,?)`;
    db.query(addAboutQuery, [title, description,img], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "About Post added successfully" });
    });
  };


  const getAllAboutPosts = async (req, res) => {
    const getAboutPosts = `SELECT * FROM about`;
    db.query(getAboutPosts, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };


  const getAboutPostById = async (req, res) => {
    const { id } = req.params;
    const getAboutPost = `SELECT * FROM about WHERE id =?`;
    db.query(getAboutPost, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result[0]);
    });
  }




  const updateAboutPost = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const img =
      req.files && req.files["img"]
        ? req.files["img"][0].filename
        : null;
  
    const sqlSelect = "SELECT title, description, img FROM about WHERE id = ?";
  
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
      const updatedabout_title =
        title !== undefined && title !== null && title !== ""
          ? title
          : existing.title;
  
      const updatedabout_description =
        description !== undefined && description !== null && description !== ""
          ? description
          : existing.description;
  
      const updatedabout_img =
        img !== null ? img : existing.img;
  
      const updateAboutQuery = `UPDATE about SET title = ?,description = ?, img = ? WHERE id = ?`;
  
      db.query(
        updateAboutQuery,
        [updatedabout_title, updatedabout_description, updatedabout_img, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "About Post updated successfully" });
        }
      );
    });
  };
  




  const deleteAboutPost = async (req, res) => {
    const { id } = req.params;
    const deleteAboutQuery = `DELETE FROM about WHERE id =?`;
    db.query(deleteAboutQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "About Post deleted successfully" });
    });
  };




module.exports = {

    addAbout,
    updateAboutPost,
    getAllAboutPosts,
    getAboutPostById,
    deleteAboutPost,
  };