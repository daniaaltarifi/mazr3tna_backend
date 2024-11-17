const db = require("../config.js");

// إضافة شروط الاستخدام (Terms and Conditions)
const addTermsAndConditions = async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }
    const addTermsAndConditionsQuery = `INSERT INTO termsandconditions (title, description) VALUES (?, ?)`;
    db.query(addTermsAndConditionsQuery, [title, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Terms and Conditions added successfully" });
    });
};

// الحصول على جميع شروط الاستخدام
const getTermsAndConditions = async (req, res) => {
    const getTermsAndConditionsQuery = `SELECT * FROM termsandconditions`;
    db.query(getTermsAndConditionsQuery, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
};

// الحصول على شروط الاستخدام بواسطة الـ ID
const getTermsAndConditionsById = async (req, res) => {
    const { id } = req.params;
    const getTermsAndConditionsQuery = `SELECT * FROM termsandconditions WHERE id =?`;
    db.query(getTermsAndConditionsQuery, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
};

// تحديث شروط الاستخدام
const updateTermsAndConditions = async (req, res) => {
    const { id } = req.params;       
    const { title, description } = req.body; 
    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }
    const updateTermsAndConditionsQuery = `UPDATE termsandconditions SET title = ?, description = ? WHERE id = ?`;

    db.query(updateTermsAndConditionsQuery, [title, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Terms and Conditions not found" });
        }
        res.json({ message: "Terms and Conditions updated successfully" });
    });
};

// حذف شروط الاستخدام
const deleteTermsAndConditions = async (req, res) => {
    const { id } = req.params;
    const deleteTermsAndConditionsQuery = `DELETE FROM termsandconditions WHERE id =?`;
    db.query(deleteTermsAndConditionsQuery, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Terms and Conditions deleted successfully" });
    });
};

module.exports = { 
    addTermsAndConditions, 
    getTermsAndConditions, 
    getTermsAndConditionsById, 
    updateTermsAndConditions, 
    deleteTermsAndConditions 
};
