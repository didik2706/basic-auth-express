require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../connection/conn');
const jwt = require('jsonwebtoken');
const {
  JWT_SECRET_KEY,
  JWT_TIME_EXPIRE
} = process.env;
const bcrypt = require('bcrypt');

router.get('/login', async (req, res) => {
  const { authorization } = req.headers;

  const dataAuth = authorization.split(' ');
  const dataUser = Buffer.from(dataAuth[1], 'base64').toString('ascii').split(':');

  if (dataAuth[0] === "Basic") {
    await db
      .select()
      .from('tb_users')
      .where({ email: dataUser[0] })
      .then(async data => {
        await bcrypt.compare(dataUser[1] ,data[0].password, (err, passed) => {
          if (passed) {
            const token = jwt.sign({
              id_user: data[0].id_user,
              name: data[0].name,
              email: data[0].email
            }, JWT_SECRET_KEY, {
              expiresIn: JWT_TIME_EXPIRE
            });

            return res
              .setHeader('X-App-Token', token)
              .json({
                status: true,
                message: 'user berhasil login'
              })
          } else {
            return res.status(401).json({
              status: false,
              message: 'wrong password'
            })
          }
        })
      })
      .catch(error => {
        return res.status(400).json({
          status: false,
          message: error.message
        })
      })
  } else {
    return res.status(401).json({
      status: false,
      message: "Unauthorized"
    })
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  await db('tb_users')
    .insert({
      name,
      email,
      password: bcrypt.hashSync(password, 10)
    })
    .then(data => {
      return res.status(201).json({
        status: true,
        message: 'data berhasil ditambahkan',
        data
      })
    })
    .catch(error => {
      return res.status(400).json({
        status: false,
        message: error.message
      })
    })
});

module.exports = router;
