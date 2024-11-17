const db = require("../config.js");

const checkBrandIDExists = (brandID, callback) => {
  const query = `SELECT * FROM brands WHERE id = ?`;
  db.query(query, [brandID], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
};

const addProduct = (req, res) => {
  const {
    name,
      ,
    sale,
    main_product_type,
    product_type,
    season,
    brandID,
    BagTypeID,
    BagVariants,
    FragranceTypeID,
    FragranceVariants,
    WatchTypeID,
    available,
    before_price,
    after_price,
    instock
    } = req.body;

  const images = req.files;
  // Check if the brandID exists
  checkBrandIDExists(brandID, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) {
      return res.status(400).json({ error: "Invalid brandID." });
    }

    const productQuery = `
      INSERT INTO product (name,  , sale, main_product_type, product_type, season, brandID, instock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      productQuery,
      [
        name,
          ,
        sale,
        main_product_type,
        product_type,
        season,
        brandID,
        instock,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastProductId = result.insertId;
        console.log(lastProductId)
        if (images && images.length > 0) {
          const imageQueries = images.map((image) => {
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
          });

          Promise.all(imageQueries)
            .then(() => {
              handleProductTypeInsertion(
                main_product_type,
                lastProductId,
                BagTypeID,
                BagVariants,
                FragranceTypeID,
                FragranceVariants,
                WatchTypeID,
                available,
                before_price,
                after_price,
                res
              );
            })
            .catch((err) => res.status(500).json({ error: err.message }));
        } else {
          handleProductTypeInsertion(
            main_product_type,
            lastProductId,
            BagTypeID,
            BagVariants,
            FragranceTypeID,
            FragranceVariants,
            WatchTypeID,
            available,
            before_price,
            after_price,
            res
          );
        }
      }
    );
  });
};

const handleProductTypeInsertion = (
  main_product_type,
  lastProductId,
  BagTypeID,
  BagVariants,
  FragranceTypeID,
  FragranceVariants,
  WatchTypeId,
  available,
  before_price,
  after_price,
  res
) => {
  if (main_product_type === "Bag") {
    const insertBagQuery = `INSERT INTO bags (BagTypeID, ProductID) VALUES (?, ?)`;
    db.query(insertBagQuery, [BagTypeID, lastProductId], (err, bagResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const lastBagId = bagResult.insertId;

      if (BagVariants && BagVariants.length > 0) {
        const variantQueries = BagVariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const variantQuery = `INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price, Color) VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(
              variantQuery,
              [
                lastBagId,
                variant.size,
                variant.available,
                variant.before_price,
                variant.after_price,
                variant.color,
              ],
              (err) => {
                if (err) reject(err);
                resolve();
              }
            );
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(201).json({
              message: "Product and variants added as Bag with color.",
            })
          )
          .catch((err) => res.status(500).json({ error: err.message }));
      } else {
        res
          .status(201)
          .json({ message: "Product added as Bag without variants." });
      }
    });
  } else if (main_product_type === "Fragrance") {
    const insertFragranceQuery = `INSERT INTO fragrances (FragranceTypeID, ProductID) VALUES (?, ?)`;
    db.query(
      insertFragranceQuery,
      [FragranceTypeID, lastProductId],
      (err, fragranceResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastFragranceId = fragranceResult.insertId;
        if (FragranceVariants && FragranceVariants.length > 0) {
          
          const variantQueries = FragranceVariants.map((variant) => {
            return new Promise((resolve, reject) => {
              const variantQuery = `
                            INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price) 
                            VALUES (?, ?, ?, ?, ?)`;
              db.query(
                variantQuery,
                [
                  lastFragranceId,
                  variant.size,
                  variant.available,
                  variant.before_price,
                  variant.after_price,
                ],
                (err) => {
                  if (err) reject(err);
                  resolve();
                }
              );
            });
          });

          Promise.all(variantQueries)
            .then(() =>
              res
                .status(201)
                .json({ message: "Product and variants added as Fragrance." })
            )
            .catch((err) => res.status(500).json({ error: err.message }));
        } else {
          res
            .status(201)
            .json({ message: "Product added as Fragrance without variants." });
        }
      }
    );
  } else if (main_product_type === "Watch") {
    const ProductID  = lastProductId;
    const insertWatchQuery = `INSERT INTO watches ( WatchTypeId, Available, before_price, after_price,ProductID) VALUES (?, ?, ?, ?,?)`;
    db.query(
      insertWatchQuery,
      [ WatchTypeId,available,before_price,after_price,ProductID],
      (err, watchResult) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({ message: "Product added as Watch." });
      }
    );
  } else {
    res.status(400).json({ error: "Invalid main product type." });
  }
};
const updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
      ,
    sale,  
    main_product_type,
    product_type,
    season,
    brandID,
    BagTypeID,
    BagVariants,
    WatchTypeID,
    FragranceTypeID,
    instock,
    variants,
  } = req.body;
  const files = req.files;  

  
  if (!id || !name || !main_product_type || !instock || !brandID) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  
  const checkBrandQuery = `SELECT * FROM brands WHERE id = ?`;
  db.query(checkBrandQuery, [brandID], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid brandID." });
    }

    const saleValue = sale ? "Yes" : "No"; 

    const productQuery = `UPDATE product 
      SET name = ?,    = ?, sale = ?, main_product_type = ?, product_type = ?, season = ?, brandID = ?, instock = ? 
      WHERE id = ?`;

    db.query(productQuery, [
      name,   , saleValue, main_product_type, product_type, season, brandID, instock === "Yes" ? "yes" : "no", id
    ], (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated product:", { id, name,   , saleValue, main_product_type, product_type, season, brandID, instock });

      if (files && files.length > 0) {
        const insertImagesQuery = `INSERT INTO product_images (ProductID, img) VALUES ?`;
        const imagePaths = files.map(file => [`${file.path}`]);

        db.query(insertImagesQuery, [imagePaths], (err) => {
          if (err) {
            console.error("Error inserting images:", err);
            return res.status(500).json({ error: err.message });
          }

          console.log("Images added successfully.");
        });
      }
      handleProductTypeUpdate(
        req,
        main_product_type,
        id,
        BagTypeID,
        BagVariants,
        WatchTypeID,
        FragranceTypeID,
        variants,
        res
      );
    });
  });
};


const handleProductTypeUpdate = (
  req,
  main_product_type,
  productId,
  BagTypeID,
  BagVariants,
  WatchTypeID,
  FragranceTypeID,
  variants,
  res
) => {
  if (main_product_type === "Bag") {
    if (!BagTypeID) {
      return res.status(400).json({ error: "BagTypeID is required." });
    }

    const updateBagQuery = `UPDATE bags SET BagTypeID = ? WHERE ProductID = ?`;
    db.query(updateBagQuery, [BagTypeID, productId], (err) => {
      if (err) {
        console.error("Error updating bags:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated bag type for product:", { productId, BagTypeID });

      if (BagVariants && Array.isArray(BagVariants) && BagVariants.length > 0) {
        const variantQueries = BagVariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const checkBagQuery = `SELECT COUNT(*) AS count FROM bags WHERE BagID = ?`;
            db.query(checkBagQuery, [variant.BagID], (err, results) => {
              if (err) {
                console.error("Error checking bag existence:", err);
                return reject(err);
              }

              if (results[0].count === 0) {
                const insertBagQuery = `INSERT INTO bags (BagID, BagTypeID, ProductID) VALUES (?, ?, ?)`;
                db.query(
                  insertBagQuery,
                  [variant.BagID, BagTypeID, productId],
                  (err) => {
                    if (err) {
                      console.error("Error inserting new bag:", err);
                      return reject(err);
                    }
                  }
                );
              }

              const variantQuery = `
                INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price, Color)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  Size = VALUES(Size),
                  Available = VALUES(Available),
                  before_price = VALUES(before_price),
                  after_price = VALUES(after_price),
                  Color = VALUES(Color)`;

              db.query(
                variantQuery,
                [
                  variant.BagID,
                  variant.size,
                  variant.available,
                  variant.before_price,
                  variant.after_price,
                  variant.Color,
                ],
                (err) => {
                  if (err) {
                    console.error("Error updating bag variants:", err);
                    reject(err);
                  } else {
                    console.log("Updated bag variant:", variant);
                    resolve();
                  }
                }
              );
            });
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(200).json({
              message: "Product and variants updated as Bag with color.",
            })
          )
          .catch((err) => {
            console.error("Error handling variants:", err);
            res.status(500).json({ error: err.message });
          });
      } else {
        res
          .status(200)
          .json({ message: "Product updated as Bag without variants." });
      }
    });
  }
  else if (main_product_type === "Fragrance") {
    if (!FragranceTypeID) {
      return res.status(400).json({ error: "FragranceTypeID is required." });
    }

    const updateFragranceQuery = `UPDATE fragrances SET FragranceTypeID = ? WHERE ProductID = ?`;
    db.query(updateFragranceQuery, [FragranceTypeID, productId], (err) => {
      if (err) {
        console.error("Error updating fragrances:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated fragrance type for product:", {
        productId,
        FragranceTypeID,
      });

      if (variants && Array.isArray(variants) && variants.length > 0) {
        const variantQueries = variants.map((variant) => {
          return new Promise((resolve, reject) => {
            const checkFragranceQuery = `SELECT COUNT(*) AS count FROM fragrances WHERE FragranceID = ?`;
            db.query(
              checkFragranceQuery,
              [variant.FragranceID],
              (err, results) => {
                if (err) {
                  console.error("Error checking fragrance existence:", err);
                  return reject(err);
                }

                if (results[0].count === 0) {
                  console.error(
                    "FragranceID does not exist:",
                    variant.FragranceID
                  );
                  return reject(new Error("Invalid FragranceID."));
                }

                const variantQuery = `
               INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  Size = VALUES(Size),
  Available = VALUES(Available),
  before_price = VALUES(before_price),
  after_price = VALUES(after_price);`;

                db.query(
                  variantQuery,
                  [
                    variant.FragranceID,
                    variant.size,
                    variant.available,
                    variant.before_price,
                    variant.after_price,
                  ],
                  (err) => {
                    if (err) {
                      console.error("Error updating fragrance variants:", err);
                      reject(err);
                    } else {
                      console.log("Updated fragrance variant:", variant);
                      resolve();
                    }
                  }
                );
              }
            );
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(200).json({ message: "Product updated as Fragrance." })
          )
          .catch((err) => {
            console.error("Error handling variants:", err);
            res.status(500).json({ error: err.message });
          });
      } else {
        res.status(200).json({ message: "Product updated as Fragrance." });
      }
    });
  } else if (main_product_type === "Watch") {
    if (!WatchTypeID) {
      console.log(req.body);
      return res.status(400).json({ error: "WatchTypeID is required." });
    }

    const { available, before_price, after_price } = req.body;

    const updateWatchQuery = `
      UPDATE watches 
      SET 
        WatchTypeID = ?, 
        Available = ?, 
        before_price = ?, 
        after_price = ? 
      WHERE ProductID = ?`;

    db.query(
      updateWatchQuery,
      [WatchTypeID, available, before_price, after_price, productId],
      (err) => {
        if (err) {
          console.error("Error updating watches:", err);
          return res.status(500).json({ error: err.message });
        }

        res.status(200).json({ message: "Product updated as Watch." });
      }
    );
  }
};

const getProducts = (req, res) => {
  const { main_product_type } = req.params;
  const productQuery = `
      SELECT 
          p.id, 
          p.name, 
          p.  ,
          p.main_product_type, 
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
      LEFT JOIN brands br ON p.BrandID = br.id
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
        main_product_type,
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
        main_product_type,
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
      main_product_type,
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
      SELECT p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price, MIN(pi.img) AS first_image 
      FROM product p 
      JOIN fragrances f ON p.id = f.ProductID 
      JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE f.FragranceTypeID = ? 
      GROUP BY p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price`;
    params.push(subtype);
  } else if (type === "Bags") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN bags b ON p.id = b.ProductID 
      JOIN bagvariants bv ON b.BagID = bv.BagID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE b.BagTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price`;
    params.push(subtype);
  } else if (type === "Watches") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN watches w ON p.id = w.ProductID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE w.WatchTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price`;
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
        brandID,
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
          brandID,
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
const getAllProductsWithVariantsCMS = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedDate,  
        p.product_type AS productType,
        p.season AS season,
        p.instock AS instock,
        p.sale AS sale,  
        b.BagID AS BagID,
        bv.Color AS bagColor,
        bv.Size AS bagSize,  -- إضافة Size هنا
        bv.before_price AS bagBeforePrice,
        bv.after_price AS bagAfterPrice,  
        bv.VariantID AS bagVariantId, 
        f.FragranceID AS FragranceID,
        fv.VariantFragranceID AS fragranceVariantId,
        fv.Size AS fragranceSize,
        fv.Available AS fragranceAvailable,
        fv.before_price AS fragranceBeforePrice,
        fv.after_price AS fragranceAfterPrice,
        w.WatchID AS watchId,
        w.Available AS watchAvailable,
        w.before_price AS watchBeforePrice,
        w.after_price AS watchAfterPrice,
        br.brand_name AS brandName
      FROM 
        product p
      LEFT JOIN 
        bags b ON p.id = b.ProductID
      LEFT JOIN 
        bagvariants bv ON b.BagID = bv.BagID 
      LEFT JOIN 
        fragrances f ON p.id = f.ProductID
      LEFT JOIN 
        fragrancevariants fv ON f.FragranceID = fv.FragranceID
      LEFT JOIN 
        watches w ON p.id = w.ProductID
      LEFT JOIN 
        brands br ON br.id = p.brandID
    `;

    const [products] = await db.promise().query(query);

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found." });
    }

    const productMap = {};

    products.forEach((product) => {
      const productId = product.id;

      if (!productMap[productId]) {
        productMap[productId] = {
          product: {
            id: product.id,
            name: product.name,
            brand: product.brandName,
            main_product_type: product.main_product_type,
            product_type: product.productType,
            season: product.season,
            instock: product.instock,
            sale: product.sale,
            updated_at: product.updatedDate,
              : product. ,
            FragranceID: product.FragranceID,
            BagID: product.BagID,
          },
          variants: [],
        };
      }

      if (product.main_product_type === "Fragrance" && product.FragranceID) {
        productMap[productId].variants.push({
          VariantID: product.fragranceVariantId,
          Size: product.fragranceSize,
          Available: product.fragranceAvailable,
          before_price: product.fragranceBeforePrice,
          after_price: product.fragranceAfterPrice,
        });
      } else if (product.main_product_type === "Bag" && product.BagID) {
        productMap[productId].variants.push({
          VariantID: product.bagVariantId,
          Color: product.bagColor,
          Size: product.bagSize, 
          before_price: product.bagBeforePrice,
          after_price: product.bagAfterPrice,
        });
      } else if (product.main_product_type === "Watch" && product.watchId) {
        productMap[productId].variants.push({
          Available: product.watchAvailable,
          before_price: product.watchBeforePrice,
          after_price: product.watchAfterPrice,
        });
      }
    });

    const response = Object.values(productMap).map((item) => ({
      product: item.product,
      variants: item.variants,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "An error occurred while fetching products." });
  }
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
    return res
      .status(400)
      .json({ error: "Available must be 'yes' or 'no'." });
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
      return res.status(500).json({ error: "Database query error: " + err.message });
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
        return res.status(500).json({ error: "Error fetching images: " + err.message });
      }

      const images = imageResults.map((image) => ({
        id: image.id,  
        img: image.img  
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
      return res.status(404).json({ message: "No image found with the given ID." });
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

    // Process the variants
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
      let product = acc.find(p => p.id === row.product_id);
      
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
          variants: []  // Initialize empty array for variants
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
          first_image: row.first_image
        };
        product.variants.push(variant);
      }

      return acc;
    }, []);

    // Return the products along with their variants as a response
    res.json(products);
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
  getAllProductsWithVariantsCMS,
  updateFragranceVariant,
  updateBagVariants,
  getFragranceVariantsById,
  getBagVariantsById,
  getProductById,
  deleteFragranceVariantByFragranceID,
  deleteBagVariantByVariantID,
  deleteProductImage,
  





  getAllPro,
  getAllProducts

};