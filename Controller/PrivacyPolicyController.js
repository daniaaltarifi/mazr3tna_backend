const db = require("../config.js");

const addPrivacyPolicy = async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }
    const addPrivacyPolicyQuery = `INSERT INTO privacypolicy (title, description) VALUES (?, ?)`;
    db.query(addPrivacyPolicyQuery, [title, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Privacy policy added successfully" });
    });
};


const getPrivacyPlicies = async (req, res) => {
    const getPrivacyPlicies = `SELECT * FROM privacypolicy`;
    db.query(getPrivacyPlicies, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
}

const getPrivacyPolicyById = async (req, res) => {
    const { id } = req.params;
    const getPrivacyPolicy = `SELECT * FROM privacypolicy WHERE id =?`;
    db.query(getPrivacyPolicy, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
}


const updatePrivacyPolicy = async (req, res) => {
    const { id } = req.params;       
    const { title, description } = req.body; 
    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }
    const updatePrivacyPolicyQuery = `UPDATE privacypolicy SET title = ?, description = ? WHERE id = ?`;

    db.query(updatePrivacyPolicyQuery, [title, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Privacy policy not found" });
        }
        res.json({ message: "Privacy policy updated successfully" });
    });
};



const deletePrivacyPolicy = async (req, res) => {
    const { id } = req.params;
    const deletePrivacyPolicy = `DELETE FROM privacypolicy WHERE id =?`;
    db.query(deletePrivacyPolicy, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Privacy policy deleted successfully" });
    });
}



module.exports = { addPrivacyPolicy, getPrivacyPlicies, getPrivacyPolicyById, updatePrivacyPolicy, deletePrivacyPolicy };