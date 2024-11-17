const db = require('../config.js');


const getHeaderByLang = async (req, res) => {
    // Format the category_id to return only the date part
    const {lang} = req.params
    const gethead = `
        SELECT id, title, lang, category_id
        FROM header WHERE lang= ?
    `;

    db.query(gethead,[lang], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(result); // Return the result directly
    });
}
const addHeader=async(req,res)=>{
    const {title, lang, category_id} = req.body;
    const addtitle=`INSERT INTO header(title, lang, category_id) VALUES(?,?,?)`;
    db.query(addtitle,[title, lang, category_id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'Header added successfully'});
    })
}
const deletedheader=async(req,res)=>{
    const { id } = req.params;
    const deletedheader=`DELETE FROM header WHERE id=?`;
    db.query(deletedheader,[id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'header deleted successfully'});
    })
}
const updatedheader=async(req,res)=>{
    const { id } = req.params;
    const { title, lang, category_id } = req.body;
    const updatedheader=`UPDATE header SET title=?, lang=?, category_id=? WHERE id=?`;
    db.query(updatedheader,[title, lang, category_id, id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'header updated successfully'});
    })
}
const getheaderById=async(req,res)=>{
    const { id } = req.params;
    const getheaderById=`SELECT id, title, lang, category_id
        FROM header WHERE id=?`;
    db.query(getheaderById,[id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json(result[0]);
    })
}
const getallheader=async(req,res)=>{
    const getheaderById=`SELECT h.*, ma.name AS name FROM header h LEFT JOIN main_products ma ON h.category_id = ma.id`;
    db.query(getheaderById,(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json(result);
    })
}
module.exports = { 
    getHeaderByLang ,
    addHeader,
    updatedheader,
    deletedheader,
    getheaderById,
    getallheader
};
