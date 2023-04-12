/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: Aryan Rakeshbhai Rathod Student ID:129796215 Date: 29-03-2023
*
*  Cyclic Web App URL: https://pink-fuzzy-python.cyclic.app
*
*  GitHub Repository URL: https://github.com/Aryan26101/Web322-Asignment-6
*
********************************************************************************/ 

var HTTP_PORT = process.env.PORT || 8080;
var express = require('express');
var app = express();
const stripJs = require('strip-js');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const clientSessions = require('client-sessions');
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
var blogService = require(__dirname + '/blog-service.js');
var authService = require(__dirname + '/auth-service.js');

onHttpStart = () => {
	console.log('Express http server listening on port ' + HTTP_PORT);
};
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
	cookieName: 'session',
	secret: '1776feda-a2f5-43cd-9ee2-f50f7826aa5e',
	duration: 2 * 60 * 1000,
	activeDuration: 1000 * 60,

}))

app.use(function (req, res, next) { 
	res.locals.session = req.session;
	next();
})

app.use(function (req, res, next) {
	let route = req.path.substring(1);
	app.locals.activeRoute =
		'/' +
		(isNaN(route.split('/')[1])
			? route.replace(/\/(?!.*)/, '')
			: route.replace(/\/(.*)/, ''));
	app.locals.viewingCategory = req.query.category;
	next();
});
app.engine(
	'.hbs',
	exphbs.engine({
		extname: '.hbs',
		helpers: {
			navLink: function (url, options) {
				return `<a class="nav-link ${
					url == app.locals.activeRoute ? 'active' : ''
				}" href="${url}">${options.fn(this)}</a>`;
			},
			equal: function (lvalue, rvalue, options) {
				if (arguments.length < 3)
					throw new Error('Handlebars Helper equal needs 2 parameters');
				if (lvalue != rvalue) {
					return options.inverse(this);
				} else {
					return options.fn(this);
				}
			},
			safeHTML: function (context) {
				return stripJs(context);
			},
		},
	}),
);
app.set('view engine', '.hbs');
cloudinary.config({
	cloud_name: 'dsr2a9uyf',
	api_key: '754293634516759',
	api_secret: 'rmMmc3pKrXA5WjOoKnI-Bc-3fnk',
	secure: true,
});
const upload = multer();

const validatLogin = (req, res, next) => {
	if (!req.session.user) {
		res.redirect('/login');
	} else {
		next();
	}
}

app.get('/', (req, res) => {
	res.redirect('/about');
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.get('/blog', async (req, res) => {
	const { category: categoryId } = req.query;
	if (categoryId) {
		const posts = await blogService.getPublishedPosts();
		if(!posts.length) return res.render('blog', {categories: [],post: null,next: null,prev: null,currentPosts: [],})
		
		const categories = await blogService.getCategories();
		const data = categories.map((category) => {
			return {
				...category,
				posts: posts.filter((post) => post.category === category.id),
			};
		});
		const currentPosts = posts
			.filter((post) => post.category === Number(categoryId))
			.map((post, index) => ({
				...post,
				index: index + 1,
				currentCategory: categoryId,
			}));
		console.log(currentPosts, categoryId, posts);
		return res.render('blog', {
			categories: data,
			post: currentPosts[0],
			next: currentPosts[1]?.id,
			prev: currentPosts[currentPosts.length - 1]?.id,
			currentPosts,
		});
	}
	const posts = await blogService.getPublishedPosts();
	if(!posts.length) return res.render('blog', {categories: [],post: null,next: null,prev: null,currentPosts: [],})
		
	const categories = await blogService.getCategories();
	const data = categories.map((category, index) => {
		return {
			...category,
			posts: posts.filter((post) => post.category === category.id),
		};
	});
	res.render('blog', {
		categories: data,
		post: posts[0],
		next: posts[1]?.id,
		prev: posts[posts.length - 1]?.id,
		currentPosts: posts.map((post, index) => ({ ...post, index: index + 1 })),
	});
});

app.get('/posts',validatLogin, async (req, res) => {
	if (req.query.category) {
		try {
			const posts = await blogService.getPostsByCategory(req.query.category);

			res.render('posts', { posts });
		} catch (err) {
			res.render('posts', { message: err });
		}
	} else if (req.query.minDate) {
		try {
			const posts = await blogService.getPostsByMinDate(req.query.minDate);
			res.render('posts', { posts });
		} catch (err) {
			res.render({ message: err });
		}
	} else {
		try {
			const posts = await blogService.getAllPosts();

			res.render('posts', { posts });
		} catch (err) {
			res.render('posts', { message: err });
		}
	}
});

app.get('/post/:value', async (req, res) => {
  const { value } = req.params;
  const { category } = req.query;
	const posts = await blogService.getPublishedPosts();
	const categories = await blogService.getCategories();
	const data = categories.map((category) => {
		return {
			...category,
			posts: posts.filter((post) => post.category === category.id),
		};
	});
	const currentPost = posts.filter((post) => post.id === Number(value))[0];
	
	const currentPosts = category
		? posts
				.filter((post) => post.category === Number(category))
				.map((post, index) => ({ ...post, index: index + 1,currentCategory:category }))
		: posts.map((post, index) => ({ ...post, index: index + 1 }));
	res.render('blog', {
		categories: data,
		post: currentPost,
		next: currentPosts[1]?.id,
		prev: currentPosts[currentPosts.length - 1]?.id,
		currentPosts,
	});
});
app.get('/categories',validatLogin, async (req, res) => {
	try {
		const categories = await blogService.getCategories();
		res.render('categories', { categories });
	} catch (err) {
		res.render('categories', { message: err });
	}
});

app.post('/category/add',validatLogin, async (req, res) => { 
	async function addCategory() {
		try {
			const { category } = req.body;
			await blogService.addCategory({ category });
			res.redirect('/categories');
		} catch (err) {
			res.send(err);
		}
		
	}

	await addCategory();
})

app.get('/posts/add',validatLogin, (req, res) => {
	blogService.getCategories().then((data) => {
		res.render('addPost', { categories: data });
	}).catch((err) => { 
		res.render('addPost', { categories: [] });
	});
});
app.get('/categories/add',validatLogin, (req, res) => {
	res.render('addCategory');
});
app.post('/posts/add',validatLogin, upload.single('featureImage'), (req, res) => {
	let streamUpload = (req) => {
		return new Promise((resolve, reject) => {
			let stream = cloudinary.uploader.upload_stream((error, result) => {
				if (result) {
					resolve(result);
				} else {
					reject(error);
				}
			});

			streamifier.createReadStream(req.file.buffer).pipe(stream);
		});
	};

	async function upload(req) {
		let result = await streamUpload(req);
		return result;
	}
	async function processPost(imageUrl) {
		req.body.featureImage = imageUrl;
		let post = {};
		post.body = req.body.body;
		post.title = req.body.title;
		post.postDate = new Date().toISOString().slice(0, 10);
		post.category = req.body.category;
		post.featureImage = req.body.featureImage;
		post.published = req.body.published;

		if (post.title) {
			await blogService.addPost(post);
			
		}
		console.log(post,"Server");
		res.redirect('/posts');
	}
	upload(req)
		.then(async (uploaded) => {
			await processPost(uploaded.url);
		})
		.catch((err) => {
			res.send('Error Adding Post');
		});
});

app.get('/categories/delete/:id',validatLogin, async (req, res) => {
	try {
		const { id } = req.params;
		await blogService.deleteCategoryById(id);
		res.redirect('/categories');
	}
	catch (err) { 
		res.send(err);
	}
	
})

app.get('/posts/delete/:id',validatLogin, async (req, res) => { 
	try {
		const { id } = req.params;
		await blogService.deletePostById(id);
		res.redirect('/categories');
	}
	catch (err) { 
		res.send(err);
	}
})

app.get('/login', (req, res) => {
	res.render('login');
})

app.post('/login', async (req, res) => { 
	try {
		const { username, password } = req.body;
		const userAgent = req.get('User-Agent');
		const user = await authService.checkUser({ username, password, userAgent });
		req.session.user = {
			username: user.username,
			email: user.email,
			loginHistory: user.loginHistory
		};
		res.redirect('/posts');
	}
	catch (err) { 
		res.render('login', { message: err });
	}
})

app.get('/register', (req, res) => {
	res.render('register');
 })

app.post('/register', async (req, res) => { 
	try {
		const { username, password, email,password2 } = req.body;
		const userAgent = req.get('User-Agent');
		const user = await authService.registerUser({ username, password, email, userAgent, password2 });
		req.session.user = {
			username: user.username,
			email,
			loginHistory: user.loginHistory
		};
		
		res.redirect('/posts');
	}
	catch (err) { 
		res.render('register', { message: err });
	}
})


app.get('/logout', (req, res) => { 
	req.session.reset();
	res.redirect('/');
})

app.get('/userHistory',validatLogin, async (req, res) => { 
	try {
		console.log(req.session.user);
		res.render('userHistory', {...req.session.user});
	}
	catch (err) { 
		res.render('userHistory', { message: err });
	}
})

app.use((req, res) => {
	res.status(404).render('404');
});

blogService
	.initialize()
	.then(authService.initialize)
	.then(() => {
		app.listen(HTTP_PORT, onHttpStart());
	})
	.catch((err) => {
		console.log(err);
	});
