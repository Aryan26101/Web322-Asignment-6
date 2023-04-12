const Sequelize = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.SEQUELIZE_USER, process.env.SEQUELIZE_DB,process.env.SEQUELIZE_PASSWORD, {
    host: process.env.SEQUELIZE_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
})

const Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

// Defining the Category Model
const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

// Defining the relationship between the Post and Category models
Post.belongsTo(Category, { foreignKey: "category" });



exports.initialize = () => {
    return new Promise ((resolve, reject) => {
        sequelize.sync().then(() => { 
            resolve();
        }).catch((err) => {
            console.log(err)
            reject("unable to sync the database");
        })
        
    })
};


exports.getAllPosts = () => {
    return new Promise ((resolve,reject) => {
        Post.findAll().then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
};

exports.getPostsByCategory = (category) => { 
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { category: category }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
}

exports.getPublishedPosts = () => {
    return new Promise ((resolve, reject) => {
        Post.findAll({
            where: { published: true }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
};
exports.getPublishedPostsByCategory = (category) => { 
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { category: category, published: true }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
}
exports.getCategories = () => {
    return new Promise((resolve,reject) => {
        Category.findAll().then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
};

exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        try {
            Object.entries(postData).forEach(([ key, value ]) => {
                if (value == "") {
                    postData[ key ] = null;
                }
            })
            postData.postDate = new Date();
            postData.published = (postData.published) ? true : false;
            Post.create(postData).then(() => {
                resolve(postData);
            }).catch((err) => {
                reject("unable to create post");
            })
            
        }
        catch (e) { 
            reject("unable to save post");
        }
    })  
};

exports.getPostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { id: id }
        }).then((data) => {
            resolve(data[0]);
        }).catch((err) => {
            reject("no results returned");
        })
    })
};

exports.getPostsByMinDate = (minDate) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { postDate: { [Sequelize.Op.gte]: minDate } }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        })
    })
}
exports.addCategory = (categoryData) => { 
    return new Promise((resolve, reject) => {
        try {
            Object.entries(categoryData).forEach(([ key, value ]) => {
                if (value == "") {
                    categoryData[ key ] = null;
                }
            })
            Category.create(categoryData).then(() => {
                resolve(categoryData);
            }).catch((err) => {
                reject("unable to create category");
            })
            resolve(categoryData);
        }
        catch (e) { 
            reject("unable to save category");
        }
    })  
};

exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        }).then(() => {
            resolve();
        }).catch((err) => {
            reject("unable to delete category");
        })
    })
};

exports.deletePostById = (id) => { 
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: { id: id }
        }).then(() => {
            resolve();
        }).catch((err) => {
            reject("unable to delete post");
        })
    })
}