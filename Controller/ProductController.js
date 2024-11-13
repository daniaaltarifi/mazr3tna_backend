const db = require("../config.js");
const multer = require('multer'); 

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
    variants,  // added variants from the request
  } = req.body;

  const images = req.files;

  // Check if variants is a string (it can happen when sent as JSON string from the client)
  let parsedVariants = variants;
  if (typeof variants === 'string') {
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
          const { size, weight, available, before_price, after_price } = variant;
          return new Promise((resolve, reject) => {
            const insertVariantQuery = `
              INSERT INTO variants (product_id, size, weight, available, before_price, after_price)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.query(
              insertVariantQuery,
              [lastProductId, size, weight, available, before_price, after_price],
              (err) => {
                if (err) reject(err);  // Reject if there is an error inserting this variant
                resolve();  // Resolve if this variant is inserted successfully
              }
            );
          });
        });

        // Run all variant inserts concurrently
        Promise.all(variantQueries)
          .then(() => {
            // After all variants are inserted, insert images if provided
            const imageQueries = images ? images.map((image) => {
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
            }) : [];

            // Execute all image insertions
            Promise.all(imageQueries)
              .then(() => {
                res.json({ message: "Product and variants added successfully." });
              })
              .catch((err) => {
                console.error(err);
                res.status(500).json({ error: "Failed to add product images." });
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





const getProducts = (req, res) => {
  const { main_product_type } = req.params;
  const productQuery = `
      SELECT 
          p.id, 
          p.name, 
          p.ingredients,
          p.certificateID, 
          p.sale, 
          p.instock,
          fv.size,
          br.brand_name,
          (SELECT img FROM product_images WHERE ProductID = p.id LIMIT 1) AS first_image,
          (SELECT img FROM product_images WHERE ProductID = p.id ORDER BY id LIMIT 1 OFFSET 1) AS second_image,
          COALESCE(MIN(bv.Size), MIN(fv.Size)) AS size,
          COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
          COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
      FROM product p
      LEFT JOIN bags b ON p.id = b.ProductID
      LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
      LEFT JOIN fragrances f ON p.id = f.ProductID  
      LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
      LEFT JOIN watches w ON p.id = w.ProductID
      LEFT JOIN brands br ON p.main_product_type_id = br.id
      WHERE p.main_product_type = ?
      GROUP BY p.id`;

  db.query(productQuery, [main_product_type], (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching products." });
    }
    console.log(results);
    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this type." });
    }

    const formattedResults = results.map(
      ({
        id,
        name,
        certificateID,
        sale,
        instock,
        size,
        brand_name,
        first_image,
        second_image,
        after_price,
        before_price,
      }) => ({
        id,
        name,
        certificateID,
        sale,
        instock,
        size: size || null,
        brand_name: brand_name || null,
        first_image,
        second_image,
        after_price: after_price || null,
        before_price: before_price || null,
      })
    );

    res.status(200).json(formattedResults);
  });
};

const getProductTypes = (req, res) => {
  const productQuery = `
    SELECT DISTINCT p.main_product_type
    FROM product p
  `;

  db.query(productQuery, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formattedResults = results.map(({ main_product_type }) => ({
      certificateID,
    }));

    res.status(200).json(formattedResults);
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
const getProductBysubType = (req, res) => {
  const { type, subtype } = req.query;

  let query;
  let params = [];

  if (type === "Fragrance") {
    query = `
      SELECT p.id, p.name, p.sale, p.instock, p.main_product_type_id, br.brand_name, fv.Size, fv.before_price, fv.after_price, MIN(pi.img) AS first_image 
      FROM product p 
      JOIN fragrances f ON p.id = f.ProductID 
      JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.main_product_type_id = br.id 
      WHERE f.FragranceTypeID = ? 
      GROUP BY p.id, p.name, p.sale, p.instock, p.main_product_type_id, br.brand_name, fv.Size, fv.before_price, fv.after_price`;
    params.push(subtype);
  } else if (type === "Bags") {
    query = `
      SELECT p.id, p.name, p.instock, p.main_product_type_id, br.brand_name, bv.Size, bv.before_price, bv.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN bags b ON p.id = b.ProductID 
      JOIN bagvariants bv ON b.BagID = bv.BagID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.main_product_type_id = br.id 
      WHERE b.BagTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.main_product_type_id, br.brand_name, bv.Size, bv.before_price, bv.after_price`;
    params.push(subtype);
  } else if (type === "Watches") {
    query = `
      SELECT p.id, p.name, p.instock, p.main_product_type_id, br.brand_name, w.before_price, w.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN watches w ON p.id = w.ProductID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.main_product_type_id = br.id 
      WHERE w.WatchTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.main_product_type_id, br.brand_name, w.before_price, w.after_price`;
    params.push(subtype);
  } else {
    return res.status(400).json({ error: "Invalid product type" });
  }

  db.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Create a map to group results by product
    const productsMap = {};

    results.forEach((result) => {
      const {
        id,
        name,
        sale,
        instock,
        main_product_type_id,
        brand_name,
        Size,
        before_price,
        after_price,
        first_image,
      } = result;

      // If product doesn't exist in the map, create a new entry
      if (!productsMap[id]) {
        productsMap[id] = {
          id,
          name,
          sale,
          instock,
          main_product_type_id,
          brand_name,
          first_image,
          sizes: [],
        };
      }

      // Push size details for each product
      productsMap[id].sizes.push({
        Size,
        before_price,
        after_price,
      });
    });

    // Convert the map to an array of products
    const finalResults = Object.values(productsMap);
    res.json(finalResults);
  });
};

const updateFragranceVariant = (req, res) => {
  const { id } = req.params;
  const { Size, Available, before_price, after_price } = req.body;

  if (
    !id ||
    !Size ||
    !Available ||
    before_price === undefined ||
    after_price === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (Available !== "yes" && Available !== "no") {
    return res.status(400).json({ error: "Available must be 'yes' or 'no'." });
  }

  const updateQuery = `
    UPDATE fragrancevariants 
    SET 
      Size = ?, 
      Available = ?, 
      before_price = ?, 
      after_price = ? 
    WHERE variantFragranceID  = ?`;

  db.query(
    updateQuery,
    [Size, Available, before_price, after_price, id],
    (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated fragrance variant:", {
        id,
        Size,
        Available,
        before_price,
        after_price,
      });

      res
        .status(200)
        .json({ message: "Fragrance variant updated successfully." });
    }
  );
};

const updateBagVariants = (req, res) => {
  const { id } = req.params;
  const { Size, Available, before_price, after_price, color } = req.body;

  if (
    !id ||
    !Size ||
    !Available ||
    before_price === undefined ||
    after_price === undefined ||
    !color
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (Available !== "Yes" && Available !== "No") {
    return res.status(400).json({ error: "Available must be 'Yes' or 'No'." });
  }

  const updateQuery = `
    UPDATE bagvariants 
    SET 
      Size = ?, 
      Available = ?, 
      before_price = ?, 
      after_price = ?, 
      color = ? 
    WHERE VariantID = ?`;

  db.query(
    updateQuery,
    [Size, Available, before_price, after_price, color, id],
    (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated bag variant:", {
        id,
        Size,
        Available,
        before_price,
        after_price,
        color,
      });

      res.status(200).json({ message: "Bag variant updated successfully." });
    }
  );
};
const getFragranceVariantsById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }
  const query = `
    SELECT * FROM fragrancevariants 
    WHERE variantFragranceID  = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No fragrance variants found for this product ID." });
    }

    res.status(200).json(results);
  });
};

const getBagVariantsById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }

  const query = `
    SELECT * FROM bagvariants 
    WHERE VariantID  = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No bag variants found for this product ID." });
    }

    res.status(200).json(results);
  });
};
const getProductById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }
  const productQuery = `
    SELECT p.*, 
           w.WatchTypeID AS WatchTypeID, 
           wt.TypeName AS WatchTypeName, 
           w.Available  AS Available,  
           w.before_price AS WatchBeforePrice,
           w.after_price AS WatchAfterPrice,
           b.BagTypeID AS BagTypeID, 
           bt.TypeName AS BagTypeName,
           bv.VariantID AS BagVariantID,
           bv.Size AS BagSize,
           bv.Color AS BagColor,
           bv.Available AS BagAvailable,
           bv.before_price AS BagBeforePrice,
           bv.after_price AS BagAfterPrice,
           f.FragranceTypeID AS FragranceTypeID,
           ft.TypeName AS FragranceTypeName,
           fv.variantFragranceID AS FragranceVariantID,
           fv.Size AS FragranceSize,
           fv.Available AS FragranceAvailable,
           fv.before_price AS FragranceBeforePrice,
           fv.after_price AS FragranceAfterPrice
    FROM product p
    LEFT JOIN watches w ON p.id = w.ProductID
    LEFT JOIN watchtypes wt ON w.WatchTypeID = wt.WatchTypeID
    LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN bagtypes bt ON b.BagTypeID = bt.BagTypeID
    LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
    LEFT JOIN fragrances f ON p.id = f.ProductID
    LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
    LEFT JOIN fragrancetypes ft ON f.FragranceTypeID = ft.FragranceTypeID
    WHERE p.id = ?`;

  db.query(productQuery, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .json({ error: "Database query error: " + err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No product found for this ID." });
    }

    const product = results[0];

    const imagesQuery = `
      SELECT img,id FROM product_images
      WHERE ProductID = ?`;

    db.query(imagesQuery, [id], (err, imageResults) => {
      if (err) {
        console.error("Database query error (images):", err);
        return res
          .status(500)
          .json({ error: "Error fetching images: " + err.message });
      }

      const images = imageResults.map((image) => ({
        id: image.id,
        img: image.img,
      }));

      const productWithImagesAndType = {
        ...product,
        images: images,
      };

      res.status(200).json(productWithImagesAndType);
    });
  });
};


const deleteFragranceVariantByFragranceID = (req, res) => {
  const { variantFragranceID } = req.params;

  if (!variantFragranceID) {
    return res.status(400).json({ message: "FragranceID is required" });
  }

  console.log(
    `Attempting to delete fragrance variants with FragranceID: ${variantFragranceID}`
  );

  const deleteVariantQuery =
    "DELETE FROM fragrancevariants WHERE variantFragranceID  = ?";

  db.query(deleteVariantQuery, [variantFragranceID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching fragrance variants found to delete" });
    }

    res
      .status(200)
      .json({ message: "Fragrance variants deleted successfully" });
  });
};

const deleteBagVariantByVariantID = (req, res) => {
  const { VariantID } = req.params;

  if (!VariantID) {
    return res.status(400).json({ message: "VariantID is required" });
  }

  console.log(`Attempting to delete bag variant with VariantID: ${VariantID}`);

  const deleteVariantQuery = "DELETE FROM bagvariants WHERE VariantID = ?";

  db.query(deleteVariantQuery, [VariantID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching bags variants found to delete" });
    }

    res.status(200).json({ message: "Bags variants deleted successfully" });
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

    const product = productResults[0];  // Get the first product result

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

    productResults.forEach(({ size, weight, available, before_price, after_price }) => {
      console.log("Available:", available);  // Debugging: Log the available field value
      if (available.toLowerCase() === "yes") {  // Check for "yes" case-insensitively
        variantList.push({
          size,
          weight,
          before_price,
          after_price,
          available,
        });
      }
    });

   

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

    const product = productResults[0];  // Get the first product result

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

    productResults.forEach(({ size, weight, available, before_price, after_price }) => {
      if (available.toLowerCase() === "yes") {  // Check for "yes" case-insensitively
        variantList.push({
          size,
          weight,
          before_price,
          after_price,
          available,
        });
      }
    });

   

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



const deleteImagesQuery = (req,res)=> {
  const {id} = req.params.id;
  const deleteImagesQuery = `DELETE FROM product_images WHERE ProductID =?`;
  db.query(deleteImagesQuery, [id], (err) => {

    if (err) {
      console.error("Error deleting images:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Images deleted successfully." }); 
  })}

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
      variants,
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
  
          // Start accumulating the final response
          const finalResponse = {
            message: "Product updated successfully.",
            product: { id, name, ingredients, sale, instock, sourcing, season, certificateID },
            oldVariants: oldVariants,
            variants: [],
            images: [],
          };
  
          // Handle image deletion if any
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
  
          // Handle new image uploads if any
          if (files && files.length > 0) {
            const imagePaths = files.map((file) => [`${id}, ${file.path}`]);
  
            const insertImagesQuery = `INSERT INTO product_images (ProductID, img) VALUES ?`;
  
            db.query(insertImagesQuery, [imagePaths], (err) => {
              if (err) {
                console.error("Error inserting new images:", err);
                return res.status(500).json({ error: err.message });
              }
              console.log("New images added successfully.");
            });
          }
  
          // Handle variants if provided
          if (variants && Array.isArray(variants) && variants.length > 0) {
            const variantQueries = variants.map((variant) => {
              return new Promise((resolve, reject) => {
                const variantQuery = `
                  INSERT INTO variants (product_ID, size, weight, before_price, after_price, available)
                  VALUES (?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    size = VALUES(size),
                    weight = VALUES(weight),
                    before_price = VALUES(before_price),
                    after_price = VALUES(after_price),
                    available = VALUES(available)`;
  
                db.query(
                  variantQuery,
                  [
                    id,
                    variant.size,
                    variant.weight,
                    variant.before_price,
                    variant.after_price,
                    variant.available,
                  ],
                  (err) => {
                    if (err) {
                      console.error("Error updating product variant:", err);
                      reject(err);
                    } else {
                      console.log("Updated product variant:", variant);
                      resolve();
                    }
                  }
                );
              });
            });
  
            // Wait for all variants to be updated
            Promise.all(variantQueries)
              .then(() => {
                const getUpdatedVariantsQuery = `SELECT * FROM variants WHERE product_ID = ?`;
                db.query(getUpdatedVariantsQuery, [id], (err, variantsData) => {
                  if (err) {
                    console.error("Error fetching updated variants:", err);
                    return res.status(500).json({ error: err.message });
                  }
  
                  finalResponse.updatedVariants = variantsData;
  
                  const getUpdatedImagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
                  db.query(getUpdatedImagesQuery, [id], (err, imagesData) => {
                    if (err) {
                      console.error("Error fetching updated images:", err);
                      return res.status(500).json({ error: err.message });
                    }
  
                    finalResponse.images = imagesData;
  
                    res.status(200).json(finalResponse);
                  });
                });
              })
              .catch((err) => {
                console.error("Error handling variants:", err);
                res.status(500).json({ error: err.message });
              });
          } else {
            // If no variants, just fetch the images
            const getUpdatedVariantsQuery = `SELECT * FROM variants WHERE product_ID = ?`;
            db.query(getUpdatedVariantsQuery, [id], (err, variantsData) => {
              if (err) {
                console.error("Error fetching updated variants:", err);
                return res.status(500).json({ error: err.message });
              }
  
              finalResponse.variants = variantsData;
  
              const getUpdatedImagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
              db.query(getUpdatedImagesQuery, [id], (err, imagesData) => {
                if (err) {
                  console.error("Error fetching updated images:", err);
                  return res.status(500).json({ error: err.message });
                }
  
                finalResponse.images = imagesData;
  
                res.status(200).json(finalResponse);
              });
            });
          }
        }
      );
    });
  };
  

module.exports = {
  addProduct,
  getProductDetails,
  getProducts,
  deleteProduct,
  getProductBysubType,
  updateProduct,
  getProductTypes,
  updateFragranceVariant,
  updateBagVariants,
  getFragranceVariantsById,
  getBagVariantsById,
  getProductById,
  deleteFragranceVariantByFragranceID,
  deleteBagVariantByVariantID,
  deleteProductImage,

  getAllPro,
  getAllProducts,
  deleteImagesQuery,
  getProductByIdCms
};
