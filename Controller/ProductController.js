const db = require("../config.js");
const multer = require("multer");
const path = require("path");

const checkmain_product_type_idExists = (main_product_type_id, callback) => {
  const query = `SELECT * FROM main_products WHERE id = ?`;
  db.query(query, [main_product_type_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
};

const addProduct = (req, res) => {
  const {
    name,
    ingredients,
    sale,
    main_product_type_id,
    certificateID,
    sourcing,
    season,
    instock,
    variants, // added variants from the request
  } = req.body;

  const images = req.files;

  // Check if variants is a string (it can happen when sent as JSON string from the client)
  let parsedVariants = variants;
  if (typeof variants === "string") {
    try {
      parsedVariants = JSON.parse(variants); // Parse it into an array
    } catch (error) {
      return res.status(400).json({ error: "Invalid variants format." });
    }
  }

  // Ensure that parsedVariants is an array
  if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
    return res.status(400).json({ error: "Variants are required." });
  }

  // Check if the main_product_type_id exists
  checkmain_product_type_idExists(main_product_type_id, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) {
      return res.status(400).json({ error: "Invalid main_product_type_id." });
    }

    // Insert the product into the product table to get the product_id
    const productQuery = `
      INSERT INTO product (name, ingredients, sale, main_product_type_id, certificateID, sourcing, season, instock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      productQuery,
      [
        name,
        ingredients,
        sale,
        main_product_type_id,
        certificateID,
        sourcing,
        season,
        instock,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastProductId = result.insertId; // Get the product_id of the newly inserted product

        // Now insert the variants into the variants table, associating them with the product_id
        const variantQueries = parsedVariants.map((variant) => {
          const { size, weight, available, before_price, after_price } =
            variant;
          return new Promise((resolve, reject) => {
            const insertVariantQuery = `
              INSERT INTO variants (product_id, size, weight, available, before_price, after_price)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.query(
              insertVariantQuery,
              [
                lastProductId,
                size,
                weight,
                available,
                before_price,
                after_price,
              ],
              (err) => {
                if (err) reject(err); // Reject if there is an error inserting this variant
                resolve(); // Resolve if this variant is inserted successfully
              }
            );
          });
        });

        // Run all variant inserts concurrently
        Promise.all(variantQueries)
          .then(() => {
            // After all variants are inserted, insert images if provided
            const imageQueries = images
              ? images.map((image) => {
                  return new Promise((resolve, reject) => {
                    const insertImageQuery = `INSERT INTO product_images (ProductID, img) VALUES (?, ?)`;
                    db.query(
                      insertImageQuery,
                      [lastProductId, image.filename],
                      (err) => {
                        if (err) reject(err);
                        resolve();
                      }
                    );
                  });
                })
              : [];

            // Execute all image insertions
            Promise.all(imageQueries)
              .then(() => {
                res.json({
                  message: "Product and variants added successfully.",
                });
              })
              .catch((err) => {
                console.error(err);
                res
                  .status(500)
                  .json({ error: "Failed to add product images." });
              });
          })
          .catch((err) => {
            console.error("Error inserting variants:", err);
            res.status(500).json({ error: "Failed to add product variants." });
          });
      }
    );
  });
};

const deleteProduct = (req, res) => {
  const { id } = req.params;
  const sqlDelete = "DELETE FROM product WHERE id = ? ";
  const deleteFeedBack = "DELETE FROM feedback WHERE product_id = ?";
  db.query(deleteFeedBack, [id], (err, result) => {
    if (err) {
      return res.json({ message: err.message });
    }
  });
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      return res.json({ message: err.message });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching record found to delete" });
    }
    res.status(200).json({ message: "product deleted successfully" });
  });
};

const deleteProductImage = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing Image ID parameter." });
  }

  const query = `
    DELETE FROM product_images 
    WHERE id = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No image found with the given ID." });
    }

    res.status(200).json({ message: "Image deleted successfully." });
  });
};

const getProductDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Product ID is required." });
  }

  try {
    // Query to get product details along with variants
    const filterQuery = `
      SELECT 
        p.*, 
        v.before_price, 
        v.after_price, 
        v.size, 
        v.available, 
        v.weight
      FROM product p
      LEFT JOIN variants v ON v.product_ID = p.id
      WHERE p.id = ?
    `;

    const [productResults] = await db.promise().query(filterQuery, [id]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = productResults[0]; // Get the first product result

    // Query to get product images
    const imagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [id]);

    // Prepare the response object
    const response = {
      product,
      images: imageResults.map((img) => img.img),
      variants: [],
    };

    const variantList = [];

    productResults.forEach(
      ({ size, weight, available, before_price, after_price }) => {
        console.log("Available:", available); // Debugging: Log the available field value
        if (available.toLowerCase() === "yes") {
          // Check for "yes" case-insensitively
          variantList.push({
            size,
            weight,
            before_price,
            after_price,
            available,
          });
        }
      }
    );

    // Assign the list of variants to the response
    response.variants = variantList;
    // Return the response
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
const getProductByIdCms = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Product ID is required." });
  }

  try {
    // Query to get product details along with variants
    const filterQuery = `
      SELECT 
        p.*, 
        v.before_price, 
        v.after_price, 
        v.size, 
        v.available, 
        v.weight
      FROM product p
      LEFT JOIN variants v ON v.product_ID = p.id
      WHERE p.id = ?
    `;

    const [productResults] = await db.promise().query(filterQuery, [id]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = productResults[0]; // Get the first product result

    // Query to get product images
    const imagesQuery = `SELECT * FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [id]);

    // Prepare the response object
    const response = {
      product,
      images: imageResults.map((img) => ({
        id: img.id,
        img: img.img,
      })),
      variants: [],
    };

    const variantList = [];

    productResults.forEach(
      ({ size, weight, available, before_price, after_price }) => {
        if (available.toLowerCase() === "yes") {
          // Check for "yes" case-insensitively
          variantList.push({
            size,
            weight,
            before_price,
            after_price,
            available,
          });
        }
      }
    );

    // Assign the list of variants to the response
    response.variants = variantList;
    // Return the response
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
const getAllProducts = (req, res) => {
  const getAllProduct = `
  SELECT 
    p.id,
    p.name, 
    p.sale, 
    p.instock,
    MIN(pi.img) AS first_image,
  v.before_price,
  v.after_price
  FROM product p
  JOIN product_images pi ON p.id = pi.ProductID
  LEFT JOIN variants v ON p.id = v.Product_ID
  GROUP BY p.id
`;

  db.query(getAllProduct, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

const getAllPro = (req, res) => {
  const getAllProQuery = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.ingredients,
      p.sale,
      p.main_product_type_id,
      p.sourcing,
      p.season,
      p.certificateID,
      c.certificate_name AS certificate_name,
      ma.name AS main_product_type_name,
      p.instock,
      p.updated_at,
      v.id AS variant_id,
      v.size,
      v.weight,
      v.available,
      v.before_price,
      v.after_price,
      MIN(pi.img) AS first_image
    FROM product p
    LEFT JOIN variants v ON v.product_ID = p.id
    LEFT JOIN certificate c ON c.id = p.certificateID
    LEFT JOIN main_products ma ON ma.id = p.main_product_type_id 
    LEFT JOIN product_images pi ON p.id = pi.ProductID
    GROUP BY p.id, v.id
  `;

  db.query(getAllProQuery, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Group the result by product, attaching variants to each product
    const products = result.reduce((acc, row) => {
      let product = acc.find((p) => p.id === row.product_id);

      if (!product) {
        // Initialize the product object without variant data
        product = {
          id: row.product_id,
          name: row.product_name,
          ingredients: row.ingredients,
          sale: row.sale,
          main_product_type_id: row.main_product_type_id,
          sourcing: row.sourcing,
          season: row.season,
          certificateID: row.certificateID,
          certificate_name: row.certificate_name,
          instock: row.instock,
          main_product_type_name: row.main_product_type_name,
          updated_at: row.updated_at,
          variants: [], // Initialize empty array for variants
        };
        acc.push(product);
      }

      // Add variant details to the variants array if the variant exists
      if (row.variant_id) {
        const variant = {
          variant_id: row.variant_id,
          size: row.size,
          weight: row.weight,
          available: row.available,
          before_price: row.before_price,
          after_price: row.after_price,
          first_image: row.first_image,
        };
        product.variants.push(variant);
      }

      return acc;
    }, []);

    // Return the products along with their variants as a response
    res.json(products);
  });
};

const deleteImagesQuery = (req, res) => {
  const { id } = req.params.id;
  const deleteImagesQuery = `DELETE FROM product_images WHERE ProductID =?`;
  db.query(deleteImagesQuery, [id], (err) => {
    if (err) {
      console.error("Error deleting images:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Images deleted successfully." });
  });
};

const updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    ingredients,
    sale,
    main_product_type_id,
    sourcing,
    season,
    certificateID,
    instock,
    imagesToDelete,
  } = req.body;

  const files = req.files;

  if (!id || !name || !main_product_type_id || !instock) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const getOldVariantsQuery = `SELECT * FROM variants WHERE product_ID = ?`;

  db.query(getOldVariantsQuery, [id], (err, oldVariants) => {
    if (err) {
      console.error("Error fetching old variants:", err);
      return res.status(500).json({ error: err.message });
    }

    const productQuery = `
      UPDATE product
      SET name = ?, ingredients = ?, sale = ?, main_product_type_id = ?, sourcing = ?, season = ?,
          certificateID = ?, instock = ?
      WHERE id = ?`;

    db.query(
      productQuery,
      [
        name,
        ingredients,
        sale,
        main_product_type_id,
        sourcing,
        season,
        certificateID,
        instock,
        id,
      ],
      (err) => {
        if (err) {
          console.error("Error updating product:", err);
          return res.status(500).json({ error: err.message });
        }

        console.log("Product updated:", { id, name, ingredients, sale, instock });

        const finalResponse = {
          message: "Product updated successfully.",
          product: {
            id,
            name,
            ingredients,
            sale,
            instock,
            sourcing,
            season,
            certificateID,
          },
          images: [],
        };

        // Step 1: Handle image deletion
        if (imagesToDelete && imagesToDelete.length > 0) {
          const deleteImagesQuery = `DELETE FROM product_images WHERE ProductID = ? AND img IN (?)`;

          db.query(deleteImagesQuery, [id, imagesToDelete], (err) => {
            if (err) {
              console.error("Error deleting images:", err);
              return res.status(500).json({ error: err.message });
            }
            console.log("Selected images deleted successfully.");
          });
        }

        // Step 2: Handle image insertion
        if (files && files.length > 0) {
          const imageNames = files.map((file) => [
            id,
            path.basename(file.path),
          ]);

          const insertImagesQuery = `INSERT INTO product_images (ProductID, img) VALUES ?`;

          db.query(insertImagesQuery, [imageNames], (err) => {
            if (err) {
              console.error("Error inserting new images:", err);
              return res.status(500).json({ error: err.message });
            }
            console.log("New images added successfully.");
            fetchImagesAndSendResponse(id, finalResponse, res);
          });
        } else {
          fetchImagesAndSendResponse(id, finalResponse, res);
        }
      }
    );
  });
};

// Simplified function to fetch images and send response
function fetchImagesAndSendResponse(id, finalResponse, res) {
  const getUpdatedImagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
  
  db.query(getUpdatedImagesQuery, [id], (err, imagesData) => {
    if (err) {
      console.error("Error fetching updated images:", err);
      return res.status(500).json({ error: err.message });
    }

    finalResponse.images = imagesData;

    // Send the final response with product info and updated images
    res.status(200).json(finalResponse);
  });
}

const updateVariants = async (req, res) => {
  const { id } = req.params;
  const { size, weight, available, before_price, after_price } = req.body;

  const updatedsize = size !== undefined ? size : existing.size;

  const updatedweight = weight !== null ? weight : existing.weight;
  const updatedavailable =
    available !== undefined ? available : existing.available;
  const updatedbefore_price =
    before_price !== undefined ? before_price : existing.before_price;
  const updatedafter_price =
    after_price !== undefined ? after_price : existing.after_price;
  const updateBrandQuery = `UPDATE variants SET size =?, weight =?, available =?, before_price =?, after_price =? WHERE id =?`;
  db.query(
    updateBrandQuery,
    [
      updatedsize,
      updatedweight,
      updatedavailable,
      updatedbefore_price,
      updatedafter_price,
      id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "variants updated successfully" });
    }
  );
};

const getVariantBuId = (req,res)=>{
  const {id}=req.params;
  const getvariantBuIdQuery=`SELECT * FROM variants WHERE id=?`
  db.query(getvariantBuIdQuery,[id],(err,result)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(result);
  });
}

module.exports = {
  addProduct,
  getProductDetails,
  deleteProduct,
  updateProduct,
  deleteProductImage,
  getAllPro,
  getAllProducts,
  deleteImagesQuery,
  getProductByIdCms,
  updateVariants,
  getVariantBuId
};