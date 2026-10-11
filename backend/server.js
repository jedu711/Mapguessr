console.log("SERVER FILE LOADED:", new Date().toISOString());

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// cookie imports
const cookieParser = require('cookie-parser');
const { randomUUID } = require('crypto');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mapguessr',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

pool.connect()
    .then(() => console.log("DB connected"))
    .catch(err => console.error("DB connection error:", err));

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

//const rounds = [
//    { year: 1950, map: "http://localhost:3001/maps/TestMap1.avif" },
//    { year: 1444, map: "http://localhost:3001/maps/TestMap2.jpeg" },
//    { year: 1776, map: "http://localhost:3001/maps/TestMap3.jpg" },
//    { year: 262, map: "http://localhost:3001/maps/TestMap4.png" },
//    { year: 1600, map: "http://localhost:3001/maps/TestMap5.jpg" }
//];


app.use('/api', async(req, res, next) => {

    let uid = req.cookies.uid;

    try {
        if (!uid) {
            uid = randomUUID();

            res.cookie('uid', uid, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 365
            });

            await pool.query('INSERT INTO users(id) VALUES($1)', [uid]);

            console.log("Created user: ", uid);
        }

        req.uid = uid;

        next();
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ error: "uid creation failed!" });
    }
});

app.get('/api/init', (req, res) => {
    res.json({
        success: true,
        uid: req.uid
    });
});

app.get('/api/round/:round', async (req, res) => {
    const round = parseInt(req.params.round);
    const date = req.query.date;

    console.log("current date: " + date);

    if (isNaN(round) || round < 1 || round > 5) {
        return res.status(400).json({ error: "Invalid round number" });
    }

    try {
        const result = await pool.query(`
            SELECT r.year, r.map, r.description
            FROM games g
            JOIN rounds r ON g.id = r.game_id
            WHERE g.date = $1
            AND r.round_id = $2
        `, [date, round]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No data found" });
        }

        res.json({
            year: result.rows[0].year,
            map: `http://localhost:3001/maps/${result.rows[0].map}`,
            desc: result.rows[0].description
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
})

app.get('/api/gamestate/:date', async(req, res) => {
    console.log('user ' + req.uid + ' requested gamestate');
    const param = req.params.date;
    const date = new Date(param);
    const uid = req.uid;

    const game = await pool.query('SELECT id FROM games WHERE date = $1;', [date]);
    if (game.rows.length === 0) {
        console.log('game not found');
        return res.status(404).json({ error: "Game does not exist!" });
    }

    const game_id = game.rows[0].id;
    const gamestate = await pool.query(`SELECT 
        current_round, current_score, completed 
        FROM gamestate
        WHERE game_id = $1
        AND user_id = $2;
        `, [game_id, uid]);

    if (gamestate.rows.length === 0) {
        console.log('Gamestate status: 2');
        return res.json({ status: 2 });
    }

    console.log('Gamestate status: 1');
    return res.json({ 
        status: 1,
        round: gamestate.rows[0].current_round,
        score: gamestate.rows[0].current_score,
        completed: gamestate.rows[0].completed
     })
})

app.post('/api/savestate/:round', async(req, res) => {
    const round = parseInt(req.params.round);
    const total_score = req.query.total_score;
    const score = req.query.score;
    const date = req.query.date;
    const uid = req.uid;

    const game = await pool.query('SELECT id FROM games WHERE date = $1;', [date]);
    const game_id = game.rows[0].id;

    const gamestate = await pool.query(`
        SELECT current_round, current_score, completed
        FROM gamestate
        WHERE game_id = $1
        AND user_id = $2;
        `, [game_id, uid]);

    if (gamestate.rows.length === 0) {
        await pool.query(`
            INSERT INTO gamestate VALUES
            ($1, $2, $3, $4, false, $5);
            `, [game_id, uid, round + 1, total_score, score]);

        console.log('Gamestate created');
        return res.json({ status: 1 });
    } 
    else {
        await pool.query(`
            UPDATE gamestate 
            SET current_round = $1
            WHERE game_id = $2
            AND user_id = $3;
            `, [round + 1, game_id, uid]);

        await pool.query(`
            UPDATE gamestate 
            SET current_score = $1
            WHERE game_id = $2
            AND user_id = $3;
            `, [total_score, game_id, uid]);

        await pool.query(`
            UPDATE gamestate
            SET round_${round}_score = $1
            WHERE game_id = $2
            AND user_id = $3
            `, [score, game_id, uid]);

        if (round === 5) {
            await pool.query(`
                UPDATE gamestate 
                SET completed = true
                WHERE game_id = $1
                AND user_id = $2;
                `, [game_id, uid]);
        }

        console.log('Gamestate saved');
        return res.json({ status: 1 });
    }
    return res.json({ status: 2 });
})

app.use('/maps', express.static('maps'));

app.listen(3001, () => {
    console.log("Backend running on http://localhost:3001");
});
