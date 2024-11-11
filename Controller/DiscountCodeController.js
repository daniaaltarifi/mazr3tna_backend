const db = require('../config.js');

const validateDiscountCode = async (req, res) => {
    const { total_price, discount_code } = req.body;
    // Input validation
    if (!total_price || !discount_code ) {
        return res.status(400).json({ error: "Total price and discount code are required." });
    }
    try {
        // Validate discount code
        const discountQuery = `
            SELECT discount_percentage 
            FROM discount_codes 
            WHERE code = ? 
            AND (expiration_date IS NULL OR expiration_date > NOW())
            LIMIT 1
        `;
        const [rows] = await db.promise().query(discountQuery, [discount_code]);
        // Check if a valid discount code was found
        if (rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired discount code." });
        }
        const discount = rows[0].discount_percentage;
        // Calculate final price after applying discount
        const discountAmount = (total_price * discount) / 100;
        const finalPrice = total_price - discountAmount;
        // Send success response with the final price
        res.json( {message:'Discount Code applied successfully',finalPrice} );
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
// const getDiscountCode=async(req,res)=>{
//     const getcode='SELECT code, discount_percentage, expiration_date FROM discount_codes';
//     db.query(getcode,(err,result)=>{
//         if(err ) return res.status(500).json({ error:err.message})
//             res.json(result);
//     })
// }
const getDiscountCode = async (req, res) => {
    // Format the expiration_date to return only the date part
    const getcode = `
        SELECT id, code, discount_percentage, DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date
        FROM discount_codes
    `;

    db.query(getcode, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(result); // Return the result directly
    });
}
const addDiscountCode=async(req,res)=>{
    const {code, discount_percentage, expiration_date} = req.body;
    const addcode=`INSERT INTO discount_codes(code, discount_percentage, expiration_date) VALUES(?,?,?)`;
    db.query(addcode,[code, discount_percentage, expiration_date],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'Discount Code added successfully'});
    })
}
const deletedCode=async(req,res)=>{
    const { id } = req.params;
    const deletedcode=`DELETE FROM discount_codes WHERE id=?`;
    db.query(deletedcode,[id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'Discount Code deleted successfully'});
    })
}
const updatedCode=async(req,res)=>{
    const { id } = req.params;
    const { code, discount_percentage, expiration_date } = req.body;
    const updatedcode=`UPDATE discount_codes SET code=?, discount_percentage=?, expiration_date=? WHERE id=?`;
    db.query(updatedcode,[code, discount_percentage, expiration_date, id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json({message:'Discount Code updated successfully'});
    })
}
const getCodeById=async(req,res)=>{
    const { id } = req.params;
    const getcodeById=`SELECT id, code, discount_percentage, DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date
        FROM discount_codes WHERE id=?`;
    db.query(getcodeById,[id],(err,result)=>{
        if(err ) return res.status(500).json({ error:err.message})
            res.json(result[0]);
    })
}
module.exports = { validateDiscountCode,getDiscountCode ,addDiscountCode, deletedCode,updatedCode,getCodeById};
