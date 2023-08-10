const express = require('express')
const app = express();

const port = 8080;
const mysql = require('mysql2')
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}))

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, "public")));

const con = mysql.createConnection({
	host: 'localhost',
	user: 'rawl',
	password: 'userpassword',
	database: 'e_lections'
});

var current_user;
var organization_name;	

con.connect((err) => {
	if(err)
		throw err;

	con.query("CREATE DATABASE IF NOT EXISTS e_lections", (err) => {
		if(err)
			throw err;

		console.log("Created Database !")
		con.query("CREATE TABLE IF NOT EXISTS USERS (name varchar(10), password varchar(10))", (err) => {
			if(err)
				throw err;

			console.log("Created table users!");
		})
	})
});

app.listen(port, (req, res) => {
	console.log("Server connected and listening on port " + port);
})

app.get('/', (req, res) => {

	res.redirect('/login');
})

app.get('/login', (req, res) => {

	res.render('login.ejs');
})

app.get('/signup', (req, res) => {

	res.render('signup.ejs');
})

app.post('/signup', (req, res) => {

	const username = req.body.name;
	const password = req.body.password;

	con.query(`SELECT count(*) as count from users where name = '${username}'`, (err, result, fields) => {

		if(err)
			throw err;

		if(result[0].count > 0)
			res.send('USERNAME ALREADY EXISTS!');
		else {

		con.query(`INSERT INTO users VALUES ('${username}','${password}')`, (err, result, fields) => {

		if(err)
			throw err;

		var table_name = username + '_orgs';

		con.query(`CREATE TABLE IF NOT EXISTS ${table_name} (organizations varchar(10))`, (err) => {

			if(err)
				throw err;

			res.redirect('/login');
		})
	})
		}
	})

	
})

app.get('/homepage', (req, res) => {

	res.render('homepage.ejs');
})


app.post('/homepage', (req, res) => {

	const username = req.body.name;
	const password = req.body.password;

	con.query(`SELECT password from users where name = '${username}'`, (err, result, fields) => {

		if(err)
			throw err;

		if(result[0] == undefined)
			res.send('ENTERED USERNAME DOES NOT EXIST PLEASE TRY AGAIN!');
		else{

			if(result[0].password != password){
				res.send(`ENTERED PASSWORD IS INCORRECT FOR ${username}`);
			} else {

				current_user = username;

				res.render('homepage.ejs', {
					current_user: username,
					createpolllink: `/createpoll/${username}`,
				});
			}
		}
	})
	
})

app.get('/homepage/organizations', (req, res) => {

	con.query(`SELECT * from organizations where admin != '${current_user}'`, (err, result, field) => {

		console.log(result);

		res.render('organization.ejs', {
			result
		}
		);
	})
})

app.get('/homepage/organizations/:name', (req, res) => {

	const table_name = req.params.name + '_req';
	
	con.query(`INSERT INTO ${table_name} VALUES ('${current_user}',  0)`, (err) => {

		if(err)
			throw err;	

		res.redirect('/homepage/organizations');
	})
})

app.get('/createorg', (req, res) => {

	res.render('createorg.ejs', {
		user: current_user
	});
})

app.post('/createorg', (req, res) => {

	const org_name = req.body.orgname;
	organization_name = org_name;
	const org_pass = req.body.orgpassword;
	const user_orgs = current_user + '_orgs';
	const org_req = org_name + '_req';

	console.log(current_user);

	con.query('CREATE TABLE IF NOT EXISTS organizations(name varchar(10), password varchar(10), admin varchar(10))', (err) => {

		if(err)
			throw err;

		console.log('TABLE ORGS CREATED!');
		con.query(`INSERT INTO organizations VALUES ('${org_name}', '${org_pass}', '${current_user}')`, (err)=> {

			if(err)
				throw err;

			console.log('inserted values into organizations table!');

			        con.query(`CREATE TABLE IF NOT EXISTS ${org_req} (requests varchar(30), status varchar(10))`, (err) => {

						if(err)
							throw err;

							con.query(`INSERT INTO ${user_orgs} VALUES ('${org_name}')`, (err) => {

								if(err)
									throw err;

								res.redirect('/homepage');
						})
					})
		});

	})
})

app.get('/createpoll', (req, res) => {

	res.render('createpoll.ejs');	
})

app.post('/createpoll', (req, res) => {

	const title_of_election = req.body.name;
	const num_of_pos = req.body.numberOfPos;
	var pos = [];
	const user = current_user;

	for(var i = 0;i < 5;i ++) {

		if(req.body.position[i] == undefined){

			pos[i + 1] = 'null'

		} else {

			pos[i + 1] = req.body.position[i];
		}
	}


	con.query("CREATE TABLE IF NOT EXISTS polls(admin varchar(100), title varchar(100), num_of_pos numeric(2), pos1 varchar(100), pos2 varchar(100), pos3 varchar(100), pos4 varchar(100), pos5 varchar(100))", (err) => {

		if(err)
			throw err;

		console.log('TABLE POLLS CREATED !');
		con.query(`INSERT INTO polls VALUES('${user}','${title_of_election}', '${num_of_pos}', '${pos[1]}', '${pos[2]}', '${pos[3]}', '${pos[4]}', '${pos[5]}')`, (err)	=> {

			if(err)
				throw err;

			console.log('VALUES INSERTED INTO polls!');

		    for(let i = 1;i <= num_of_pos;i ++){

		    	const table_name = title_of_election + pos[i];

		    	con.query(`CREATE TABLE ${table_name} (voter varchar(100), status varchar(100), voted_for varchar(100))`, (err, result) => {

		    		if(err)
		    			throw err;
		    	})
		    }

		    res.redirect('/homepage');

		})

	
})

})

app.get('/homepage/mypolls', (req, res) => {

	// const table_name = current_user + '_polls';
	// con.query(`SELECT * FROM polls inner join ${table_name} on polls.title = ${table_name}.polls`, (err, result, fields) => {

	// 	if(err)
	// 		throw err;

	// 	res.render('mypolls.ejs', {result});
	// })

	con.query(`SELECT * FROM ${current_user}_orgs`, (err, result, fields) => {
		
		if(err)
			throw err;

		let orgs = [];

		for(let i = 0; i < result.length; i++) {

			orgs.push(result[i]['organizations'])
		}

		orgs = [orgs];

		con.query(`SELECT admin FROM organizations WHERE name in (?)`, orgs, (err, result) => {

			console.log('Select admin: ' + result);

			let admins = [];
			for(let i = 0; i < result.length; i++) {
				admins.push(result[i]['admin']);
			}
			admins = [admins];

			con.query(`SELECT * FROM POLLS WHERE admin in (?)`, admins, (err, result) => {

				console.log(result);
				res.render('mypolls.ejs', {result});
			})


		});
		
	})

	
})

app.get('/homepage/mypolls/:poll', (req, res) => {

	const poll = req.params.poll;

	con.query(`SELECT * FROM polls where title = '${poll}'`, (err, result, fields) => {

		if(err)
			throw err;

		res.render('results.ejs', {
			result: result[0]
		})

	})
	
})


app.get('/homepage/profile', (req, res) => {

	con.query(`SELECT name FROM organizations where admin = '${current_user}'`, (err, result, fields) => {

		if(err)
			throw err;

		const table_name = result[0].name + '_req';
		const table = result[0].name;

		console.log(result[0].name);

			con.query(`SELECT * from ${table_name} where status = 'no'`, (err, result, fields) => {

				if(err)
					throw err;


		  res.render('profile.ejs', {
		               current_user: current_user,
		               result: result,
		               table: table
	            });
			})
	})
})


app.get('/acceptrequest/:orgname/:name', (req, res) => {

	const accepted_user = req.params.name;
	const insert_into = req.params.orgname; //orgname
	var table_name = accepted_user + '_orgs';
	const delete_from = req.params.orgname + '_req';

	con.query(`INSERT INTO ${table_name} VALUES('${insert_into}')`, (err) => {
		if(err)
			throw err;

		con.query(`UPDATE ${delete_from} SET status = 'yes' WHERE requests = '${accepted_user}'`, (err) => {

			if(err)
				throw err;

			con.query()
		})
	})
})
