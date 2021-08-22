import { expect } from 'chai';
import * as request from 'supertest'
import App from '../src/app'
import ValidationController from '../src/api/movements/validation/validation.controller'

describe('server', function () {
    let app

    before(function () {
        app = new App(
            [
                new ValidationController(),
            ],
            5000, // Ideally, the port would be dynamic or set as an environment variable
        );
        // Probably use another port for testing aswell?
    })
    beforeEach(function (done) {
        app.listen(function (err) {
            if (err) { return done(err); }
            done();
        });
    })
    afterEach(function (done) {
        app.server.close(done);
    });


    it('says Accepted when there are no problems', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // -> 300
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1300
                {"id": 102, "date": "2010-02-17T12:00:00", "label": "shopping", "amount": -800}, // -> 500
                {"id": 103, "date": "2010-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 1500
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1000},
                {"date": "2010-03-01T12:00:00", "balance": 1500}
            ]
        }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(202, function (err, res) {
                if (err) { return done(err); }
                // Done
                done();
            });
    })


    // Likely not a case that would be seen in real circumstances
    it('says Accepted when dates are not relevant and there seems to be no problem', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2011-02-05T12:00:00", "label": "loyer", "amount": -700}, 
                {"id": 101, "date": "2011-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, 
                {"id": 102, "date": "2011-02-17T12:00:00", "label": "shopping", "amount": -800},
                {"id": 103, "date": "2011-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, 
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1000},
                {"date": "2010-03-01T12:00:00", "balance": 1500}
            ]
        }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(202, function (err, res) {
                if (err) { return done(err); }
                // Done
                done();
            });
    })


    it('handles a missing transaction', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // -> 300
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1300
                {"id": 103, "date": "2010-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 2300, missing -800 transactions
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1000},
                {"date": "2010-03-01T12:00:00", "balance": 1500},
            ]
        }
        const expectedResponse = {
            message: "I'm a teapot",
            reasons: [
                {
                  problemType: 'Balance discrepency: likely missing transactions',
                  periodStart: '2010-02-01T12:00:00',
                  periodEnd: '2010-03-01T12:00:00',
                  amountStart: 1000,
                  amountEndFound: 2300,
                  amountEndExpected: 1500,
                  actionRequired: 'Look for missing transactions'
                }
              ]
        }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect('Content-Type', /json/)
            .expect(418, function (err, res) {
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);
                // Done
                done();
            });
    })


    it('handles a set of missing transactions', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // -> 300
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1300
                {"id": 105, "date": "2010-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 2300, missing -800 transactions
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1000},
                {"date": "2010-03-01T12:00:00", "balance": 1500},
            ]
        }
        const expectedResponse = {
            message: "I'm a teapot",
            reasons: [
                {
                  problemType: 'Balance discrepency: likely missing transactions',
                  periodStart: '2010-02-01T12:00:00',
                  periodEnd: '2010-03-01T12:00:00',
                  amountStart: 1000,
                  amountEndFound: 2300,
                  amountEndExpected: 1500,
                  actionRequired: 'Look for missing transactions'
                }
              ]
        }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(418, function (err, res) {
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);
                // Done
                done();
            });
    })


    it('handles irrelevant transactions before first inspection point', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // -> 300
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1300
                {"id": 105, "date": "2010-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 2300, missing -800 transactions
            ],
            "balances": [
                {"date": "2010-03-01T12:00:00", "balance": 1500},
                {"date": "2010-04-01T12:00:00", "balance": 2000},
            ]
        }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(202, function (err, res) {
                if (err) { return done(err); }
                // Done
                done();
            });
    })

    it('handles a duplicate transaction', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // 800
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // 1800
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000},
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1500},
                {"date": "2010-03-01T12:00:00", "balance": 1800},
            ]
        }
        const expectedResponse = {
            message: "I'm a teapot",
            reasons: [
              {
                problemType: 'Duplicate Transaction',
                transactionDate: '2010-02-15T12:00:00',
                transactionAmount: 1000,
                actionRequired: 'None'
              }
            ]
          }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(418, function (err, res) {
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);
                // Done
                done();
            });
    })

    it('handles a duplicate and a missing transaction', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // 800
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // 1800
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, 
            ],
            "balances": [
                {"date": "2010-02-01T12:00:00", "balance": 1500},
                {"date": "2010-03-01T12:00:00", "balance": 2800},
            ]
        }
        const expectedResponse = {
            message: "I'm a teapot",
            reasons: [
              {
                problemType: 'Duplicate Transaction',
                transactionDate: '2010-02-15T12:00:00',
                transactionAmount: 1000,
                actionRequired: 'None'
              },
              {
                problemType: 'Balance discrepency: likely missing transactions',
                periodStart: '2010-02-01T12:00:00',
                periodEnd: '2010-03-01T12:00:00',
                amountStart: 1500,
                amountEndFound: 1800,
                amountEndExpected: 2800,
                actionRequired: 'Look for missing transactions'
              }
            ]
          }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(418, function (err, res) {
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);
                // Done
                done();
            });
    })


    it('handles a set of duplicate transactions', function (done) {
        const data = {
            "movements": [
                {"id": 106, "date": "2010-03-05T12:00:00", "label": "loyer", "amount": -700}, // -> 800
                {"id": 106, "date": "2010-03-05T12:00:00", "label": "loyer", "amount": -700}, // -> 100, duplicate, real 800
                {"id": 106, "date": "2010-03-05T12:00:00", "label": "loyer", "amount": -700}, // -> -600, duplicate, real 800
                {"id": 107, "date": "2010-03-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 400, real 1800
                {"id": 108, "date": "2010-03-17T12:00:00", "label": "shopping", "amount": -200}, // -> 200, real 1600
                {"id": 109, "date": "2010-03-18T12:00:00", "label": "shopping", "amount": -200}, // -> 0, real 1400
                {"id": 110, "date": "2010-03-19T12:00:00", "label": "shopping", "amount": -200}, // -> -200, real 1200
                {"id": 111, "date": "2010-03-20T12:00:00", "label": "shopping", "amount": -200}, // -> -400, real 1000
                {"id": 112, "date": "2010-03-31T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 600, real 2000
            ],
            "balances": [
                {"date": "2010-03-01T12:00:00", "balance": 1500},
                {"date": "2010-04-01T12:00:00", "balance": 2000},
            ]
        }
        const expectedResponse = {
            message: "I'm a teapot",
            reasons: [
              {
                problemType: 'Duplicate Transaction',
                transactionDate: '2010-03-05T12:00:00',
                transactionAmount: -700,
                actionRequired: 'None'
              },
              {
                problemType: 'Duplicate Transaction',
                transactionDate: '2010-03-05T12:00:00',
                transactionAmount: -700,
                actionRequired: 'None'
              }
            ]
          }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(418, function (err, res) {
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);

                // Done
                done();
            });
    })


    it('handles long chains of transaction problems', function (done) {
        const data = {
            "movements": [
                {"id": 100, "date": "2010-02-05T12:00:00", "label": "loyer", "amount": -700}, // -> 300
                {"id": 101, "date": "2010-02-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1300
                {"id": 105, "date": "2010-02-28T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 2300, missing -800 transactions
                {"id": 106, "date": "2010-03-05T12:00:00", "label": "loyer", "amount": -700}, // -> 800
                {"id": 106, "date": "2010-03-05T12:00:00", "label": "loyer", "amount": -700}, // -> 100, duplicate, real 800
                {"id": 107, "date": "2010-03-15T12:00:00", "label": "revenu mi mois", "amount": 1000}, // -> 1100, real 1800
                {"id": 108, "date": "2010-03-17T12:00:00", "label": "shopping", "amount": -200}, // -> 900, real 1600
                {"id": 109, "date": "2010-03-18T12:00:00", "label": "shopping", "amount": -200}, // -> 700, real 1400
                {"id": 110, "date": "2010-03-19T12:00:00", "label": "shopping", "amount": -200}, // -> 500, real 1200
                {"id": 111, "date": "2010-03-20T12:00:00", "label": "shopping", "amount": -200}, // -> 300, real 1000
                {"id": 112, "date": "2010-03-31T12:00:00", "label": "revenu fin mois", "amount": 1000}, // -> 1300, real 2000
            ],
            "balances": [
                {"date": "2010-01-01T12:00:00", "balance": 800},
                {"date": "2010-02-01T12:00:00", "balance": 1000},
                {"date": "2010-03-01T12:00:00", "balance": 1500},
                {"date": "2010-04-01T12:00:00", "balance": 2000},
                {"date": "2010-05-01T12:00:00", "balance": 1800},
                // {"date": "2010-06-01T12:00:00", "balance": 2500},
                // {"date": "2010-07-01T12:00:00", "balance": 1000},
                // {"date": "2010-08-01T12:00:00", "balance": 1500},
                // {"date": "2010-09-01T12:00:00", "balance": 2000},
                // {"date": "2010-10-01T12:00:00", "balance": 1700},
                // {"date": "2010-11-01T12:00:00", "balance": 2300},
                // {"date": "2010-12-01T12:00:00", "balance": 2500}
            ]
        }

        let expectedResponse = {
            message: "I'm a teapot",
            reasons: [
              {
                problemType: 'Duplicate Transaction',
                transactionDate: '2010-03-05T12:00:00',
                transactionAmount: -700,
                actionRequired: 'None'
              },
              {
                problemType: 'Balance discrepency: likely missing transactions',
                periodStart: '2010-02-01T12:00:00',
                periodEnd: '2010-03-01T12:00:00',
                amountStart: 1000,
                amountEndFound: 2300,
                amountEndExpected: 1500,
                actionRequired: 'Look for missing transactions'
              },
              { // OF NOTE: It seems my algorithm is working so well it finds discrepancies I didn't even plan out; this one came for free!
                problemType: 'Balance discrepency: likely missing transactions',
                periodStart: '2010-04-01T12:00:00',
                periodEnd: '2010-05-01T12:00:00',
                amountStart: 2000,
                amountEndFound: 2000,
                amountEndExpected: 1800,
                actionRequired: 'Look for missing transactions'
              }
            ]
          }

        request(app.app)
            .post('/movements/validation')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(418, function (err, res) {
                console.log(res.body)
                if (err) { return done(err); }
                expect(res.body).to.deep.equal(expectedResponse);
                // Done
                done();
            });
    })
})