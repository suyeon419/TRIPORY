var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const schedulesRouter = require('./routes/schedules');
const inquiriesRouter = require('./routes/inquiries');

var app = express();

const cors = require('cors');

// CORS 설정
app.use(
    cors({
        origin: 'http://localhost:5173', // 프론트엔드 주소
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, // 쿠키/JWT 전송 허용 (필요 시)
    })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/posts', postsRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/uploads', express.static('uploads'));
app.use('/comments', commentsRouter);
app.use('/schedules', schedulesRouter);
app.use('/inquiries', inquiriesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
