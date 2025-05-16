const express = require('express'); // Import express
const mysql = require('mysql2'); 
const bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
const path = require('path');
const app = express(); 
const PORT = 3001; 



// Create MySQL connection
const connection = mysql.createConnection({
    host: 'mysql-jerlene.alwaysdata.net',
    user: 'jerlene',
    password: 'Jsly2005',
    database: 'jerlene_mini_proj',
});

// Callback function to log whether the connection to the database was successful or not
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine which is EJS as the template engine for rendering views
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
// Middleware to parse URL-encoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Define a GET route for home page
app.get('/', (req, res) => {
    // SQL query to fetch upcoming work schedules that have not been clocked out
    const query = `
        SELECT ws.*, cio.clock_in_time, cio.clock_out_time 
        FROM work_schedule ws
        LEFT JOIN clock_in_out cio ON ws.schedule_id = cio.schedule_id
        WHERE cio.clock_out_time IS NULL
        ORDER BY ws.work_date DESC`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.render('index', { work_schedule: results });
    });
});

// Route to get a specific event by ID
app.get('/event/:id', (req, res) => {
    // Extracting the 'id' parameter from the request parameters and converting it to an integer
    const schedule_id = req.params.id;
    const sql = 'SELECT * FROM work_schedule WHERE schedule_id = ?';
    // Fetch data from MySQL based on the schedule ID
    connection.query( sql, [schedule_id],(error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Event by ID');
        }
        // Checking if an event with the specified 'id' was found
        if (results.length > 0) {
            //Render HTML page with the event data
            res.render('event', { work_schedule:results[0] });
        } else {
            // If no event with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Event not found');
        }
    });
});

// Add New Event
// Renders the addEvent.ejs view for adding a new event.
app.get('/addEvent', (req, res) => {
    res.render('addEvent');
});

//Handles form submissions to add a new event to the database.
app.post('/addEvent', (req, res) => {
    const { title, work_date, start_time, end_time } = req.body;
    const sql = 'INSERT INTO work_schedule (title, work_date, start_time, end_time) VALUES (?, ?, ?, ?)';
    connection.query(sql, [title, work_date, start_time, end_time], (error, results) => {
        if (error) {
            console.error("Error adding event:", error);
            res.status(500).send('Error adding event');
        } else {
            res.redirect('/');
        }
    });
});

// EDIT EVENT (UPDATE)
app.get('/editEvent/:id', (req, res) => {
    // Extracting the 'id' parameter from the request parameters and converting it to an integer
    const schedule_id = req.params.id;
    const sql = 'SELECT * FROM work_schedule WHERE schedule_id = ?';
    // Fetch data from MySQL based on the schedule ID
    connection.query( sql, [schedule_id],(error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Event by ID');
        }
        // Checking if an event with the specified 'id' was found
        if (results.length > 0) {
            //Render HTML page with the event data
            res.render('editEvent', { work_schedule:results[0] });
        } else {
            // If no event with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Event not found');
        }
    });
});

//Posting edited event (form)
app.post('/editEvent/:id', (req, res) => {
    const schedule_id = req.params.id;
    // Extract EVENT data from the request body
    const { title, work_date, start_time, end_time } = req.body;
    

    const sql = 'UPDATE work_schedule SET title = ?, work_date = ?, start_time = ?, end_time = ? WHERE schedule_id = ?';
    // Insert the new EVENT into the database
    connection.query( sql, [title, work_date, start_time, end_time , schedule_id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating event:", error);
            res.status(500).send('Error updating event');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
}); 

// DELETE EVENT BY ID
app.get('/deleteEvent/:id', (req, res) => {
    const schedule_id = req.params.id;
    const sql = 'DELETE FROM work_schedule WHERE schedule_id = ?';
    connection.query(sql, [schedule_id], (error, results) => {
        if (error) {
            console.error('Error deleting event:', error);
            res.status(500).send('Error deleting event');
        } else {
            res.redirect('/');
        }
    });
});

// Resume Routes
app.get('/resume', (req, res) => {
    const query = 'SELECT * FROM resume ORDER BY start_work_date DESC';
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.render('resume', { resume: results });
    });
});

// Post Resume form submission
app.post('/resume', (req, res) => {
    const { job_title, start_work_date, end_work_date, comments } = req.body;
    const sql = 'INSERT INTO resume (job_title, start_work_date, end_work_date, comments) VALUES (?, ?, ?, ?)';
    connection.query(sql, [job_title, start_work_date, end_work_date, comments], (error, results) => {
        if (error) {
            console.error("Error adding resume:", error);
            res.status(500).send('Error adding resume');
        } else {
            res.redirect('/resume');
        }
    });
});

//EDIT RESUME (UPDATE)
app.get('/editResume/:id', (req, res) => {
    // Extracting the 'id' parameter from the request parameters and converting it to an integer
    const resume_id = req.params.id;
    const sql = 'SELECT * FROM resume WHERE resume_id = ?';
    // Fetch data from MySQL based on the resume ID
    connection.query( sql, [resume_id],(error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Resume by ID');
        }
        // Checking if a resume with the specified 'id' was found
        if (results.length > 0) {
            //Render HTML page with the resume data
            res.render('editResume', { resume:results[0] });
        } else {
            // If no resume with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Resume not found');
        }
    });
});

//Posting edited resume and update it
app.post('/editResume/:id', (req, res) => {
    const resume_id = req.params.id;
    // Extract resume data from the request body
    const {job_title, start_work_date, end_work_date, comments } = req.body;
    

    const sql = 'UPDATE resume SET job_title = ?, start_work_date = ?, end_work_date = ?, comments = ? WHERE resume_id = ?';
    // Insert the new edited resume into the database
    connection.query( sql, [job_title, start_work_date, end_work_date, comments, resume_id] , (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating resume:", error);
            res.status(500).send('Error updating resume');
        } else {
            // Send a success response
            res.redirect('/resume');
        }
    });
}); 

// DELETE RESUME BY ID
app.get('/deleteResume/:id', (req, res) => {
    const resume_id = req.params.id;
    const sql = 'DELETE FROM resume WHERE resume_id = ?';
    connection.query(sql, [resume_id], (error, results) => {
        if (error) {
            console.error('Error deleting resume:', error);
            res.status(500).send('Error deleting resume');
        } else {
            res.redirect('/resume');
        }
    });
});

// Clock In/Out Routes
// Defines a POST route to handle clock-in requests
app.post('/clockIn', (req, res) => {
    const { schedule_id } = req.body;
    // SQL query to insert a new clock-in record. If a record with the same schedule_id already exists, it updates the clock_in_time to the current time.
    const sqlClockIn = 'INSERT INTO clock_in_out (schedule_id, clock_in_time) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE clock_in_time=NOW()';
    // Executes the SQL query with the provided schedule_id
    connection.query(sqlClockIn, [schedule_id], (error, results) => {
        if (error) throw error;
        res.redirect('/clockIn');
    });
});

// Defines a POST route to handle clock-out requests.
app.post('/clockOut', (req, res) => {
    const { schedule_id } = req.body;
    // SQL query to update the clock_out_time to the current time for the given schedule_id where the clock_out_time is currently NULL.
    const sql = 'UPDATE clock_in_out SET clock_out_time = NOW() WHERE schedule_id = ? AND clock_out_time IS NULL';
    connection.query(sql, [schedule_id], (error, results) => {
        if (error) throw error;
        res.redirect('/clockOut');
    });
});

// Defines a GET route to fetch events that have been clocked in but not yet clocked out
app.get('/clockIn', (req, res) => {
    //  SQL query to select work schedules and their associated clock-in and clock-out times, filtering for records where clock_out_time is NULL.
    const query = `
        SELECT ws.*, cio.clock_in_time, cio.clock_out_time
        FROM work_schedule ws
        JOIN clock_in_out cio ON ws.schedule_id = cio.schedule_id
        WHERE cio.clock_out_time IS NULL
        ORDER BY cio.clock_in_time DESC`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.render('clockIn', { clocked_in_events: results });
    });
});

// Defines a GET route to fetch events that have been clocked out
app.get('/clockOut', (req, res) => {
    // SQL query to select work schedules and their associated clock-in and clock-out times, filtering for records where clock_out_time is NOT NULL. And calculates the total time worked in seconds.
    const query = `
        SELECT ws.*, cio.clock_in_time, cio.clock_out_time, 
        TIMESTAMPDIFF(SECOND, cio.clock_in_time, cio.clock_out_time) AS seconds_worked
        FROM work_schedule ws
        JOIN clock_in_out cio ON ws.schedule_id = cio.schedule_id
        WHERE cio.clock_out_time IS NOT NULL
        ORDER BY cio.clock_out_time DESC`;
    connection.query(query, (err, results) => {
        if (err) throw err;

        // Loops through the results and format the time into hours, minutes, and seconds
        results.forEach(event => {
            const totalSeconds = event.seconds_worked;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            event.hours_worked = `${hours}h ${minutes}m ${seconds}s`;
        });

        res.render('clockOut', { clocked_out_events: results });
    });
});

// Start the Express server on PORT 3000
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});




