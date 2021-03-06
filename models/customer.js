"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

    /** get a customer by name. */

    static async findName(name) {
      const names = name.split(" ");
      const firstName = names[0];
      const lastName = names[1];

      const results = await db.query(
        `SELECT id,
                    first_name AS "firstName",
                    last_name  AS "lastName",
                    phone,
                    notes
             FROM customers
             WHERE first_name = $1 AND last_name = $2`,
        [firstName, lastName],
      );

      const customer = results.rows[0];

      if (customer === undefined) {
        const err = new Error(`No such customer: ${firstName} ${lastName}`);
        err.status = 404;
        throw err;
      }

      return new Customer(customer);
    }

    /** get top 10 customers ordered by most reservations. */

    static async findTopTen() {
      const results = await db.query(
        `SELECT COUNT(customer_id), customer_id
                FROM reservations
                GROUP BY customer_id
                ORDER BY COUNT(customer_id) DESC
                LIMIT 10;`,
      );

      const ids = results.rows.map(c => c.customer_id);
      console.log(ids)

      const customers = await Promise.all( ids.map( async function(i) {
        return await Customer.get(i);
      }));
      console.log(customers);
      return customers;
    }

  /** get first & last name for this customer by customer id. */

  fullName() {
    return this.firstName + " " + this.lastName;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }



  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;
