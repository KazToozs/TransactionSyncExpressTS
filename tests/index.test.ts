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
    it('receives statements', function (done) {
        const data = {
            "movements": [
                {"id": 1234, "date": "1995-12-17T13:24:00", "label": "loyer", "amount": 1000},
                {"id": 1234, "date": "1994-12-17T13:24:00", "label": "loyer", "amount": 1000},
                {"id": 1234, "date": "1993-12-17T13:24:00", "label": "loyer", "amount": 1000},
                {"id": 1234, "date": "1997-12-17T13:24:00", "label": "loyer", "amount": 1000},
                {"id": 1234, "date": "1996-12-17T13:24:00", "label": "loyer", "amount": 1000},
            ],
            "balances": [
                {"date": "1995-12-17T13:24:00", "balance": 455567},
                {"date": "1995-12-17T13:24:00", "balance": 455567}
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
    it('syncs statements', function () {

    })
})