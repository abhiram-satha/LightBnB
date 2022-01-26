const properties = require('./json/properties.json');
const users = require('./json/users.json');
const {Pool} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
})
// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`
      SELECT id, name, email, password
      FROM users
      WHERE email = $1`, [email])
    .then((result) => {
        // console.log(result.rows[0]);
        return result.rows[0];
      })
    .catch((err) => {
      console.log(err);
      return null;
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT id, name, email, password
      FROM users
      WHERE id = $1`, [id])
    .then((result) => {
      // console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *`, [user.name, user.email, user.password])
    .then((id) => {
      return id;
    })
    .catch(err => {
      return null;
    })
}    
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
    SELECT reservations.id AS id, reservations.start_date AS start_date, properties.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.start_date
    LIMIT $2;
    `, [guest_id, limit])
    .then((result)=> {
      // result.rows.forEach(reservation => {
      //   console.log(reservation)
      // });
      return result.rows;
    }).catch(err => {
      return null;
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE TRUE `;

  if(options.city) {
    queryParams.push(`%${options.city}%`)
    const length = queryParams.length;
    queryString += ` AND city like $${length} `
  }

  if(options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    const length = queryParams.length;
    queryString += ` AND owner_id like $${length} `
  }

  if(options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`*100);
    const length = queryParams.length;
    queryString += `AND properties.cost_per_night >= $${length} `
  }

  if(options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`*100)
    const length = queryParams.length;
    queryString += ` AND properties.cost_per_night <= $${length}`
  }

  if(options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`) 
    const length = queryParams.length;
    queryString += ` AND rating >= $${length}`
  }

    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
    console.log(queryString, queryParams);
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  let queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country,  parking_spaces, number_of_bathrooms,  number_of_bedrooms)
                      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                      RETURNING *`;
  let propertyKeys = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country,  property.parking_spaces, property.number_of_bathrooms,  property.number_of_bedrooms]
  return pool
  .query(queryString, propertyKeys)
  .then(result => {
    console.log(result);
    return result.rows[0]
  })
  .catch(err=> {
    console.log('error',err.message)
  })
}
exports.addProperty = addProperty;


/* 
SELECT * FROM properties
WHERE title = 'Havana';

INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country,  parking_spaces, number_of_bathrooms,  number_of_bedrooms )
                      VALUES(622, 'description1','description2', 'description3', 'description4', 1000, 'description6', 'description7', 'description8', 'description9', 'description10', 10, 10, 10)
                      RETURNING *;
*/