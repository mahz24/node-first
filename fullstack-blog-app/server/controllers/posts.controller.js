// Models
const { Post } = require('../models/post.model');
const { User } = require('../models/user.model');
const { Comment } = require('../models/comment.model');
const { PostImg } = require('../models/postImg.model');

const { ref, uploadBytes } = require('firebase/storage');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { storage } = require('../utils/firebase');
const { async } = require('@firebase/util');

const getAllPosts = catchAsync(async (req, res, next) => {
  const posts = await Post.findAll({
    where: { status: 'active' },
    include: [
      {
        model: PostImg,
      },
      { model: User, attributes: { exclude: ['password'] } },
      {
        model: Comment,
        include: [{ model: User, attributes: ['id', 'name'] }],
      },
    ],
  });

  res.status(200).json({
    posts,
  });
});

const createPost = catchAsync(async (req, res, next) => {
  const { title, content } = req.body;
  const { sessionUser } = req;

  const newPost = await Post.create({ title, content, userId: sessionUser.id });

  const postImgsPromises = req.files.map(async file => {
    const imgRef = ref(storage, `post/${file.originalname}`);

    const imgUploaded = await uploadBytes(imgRef, file.buffer);

    return await PostImg.create({
      postId: newPost.id,
      postImgUrl: imgUploaded.metadata.fullPath,
    });
  });

  await Promise.all(postImgsPromises);

  res.status(201).json({ newPost });
});

const getPostById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const post = await Post.findOne({ where: { id } });

  res.status(200).json({
    post,
  });
});

const updatePost = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const post = await Post.findOne({ where: { id } });

  await post.update({ title, content });

  res.status(200).json({ status: 'success' });
});

const deletePost = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const post = await Post.findOne({ where: { id } });

  await post.update({ status: 'deleted' });

  res.status(200).json({
    status: 'success',
  });
});

const getUsersPosts = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const posts = await Post.findAll({
    where: { userId: id, status: 'active' },
    include: [{ model: User, attributes: { exclude: ['password'] } }],
  });

  res.status(200).json({ posts });
});

const getMyPosts = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  const posts = await Post.findAll({
    where: { userId: sessionUser.id, status: 'active' },
    include: [
      {
        model: User,
        attributes: { exclude: ['password'] },
      },
    ],
  });

  res.status(200).json({ posts });
});

module.exports = {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getUsersPosts,
  getMyPosts,
};
