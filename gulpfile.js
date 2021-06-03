	var gulp              = require('gulp'),              // Подключаем Gulp
		sass              = require('gulp-sass'),         // Подключаем Sass пакет
		gutil             = require('gulp-util' ),        // Подключаем утилиту разработки плагинов
		browserSync       = require('browser-sync'),      // Подключаем библиотеку Browser Sync
		del               = require('del'),               // Подключаем библиотеку для удаления файлов и папок
		fileinclude    	  = require('gulp-file-include'), // Подключаем библиотеку для инклюда чанков
		imagemin          = require('gulp-imagemin'),     // Подключаем библиотеку для работы с изображениями (сжатие картинок)
		qcmq			  = require('gulp-group-css-media-queries'),
		sourcemaps 		  = require('gulp-sourcemaps');
		imageminPngquant  = require('imagemin-pngquant'),
		imageminZopfli    = require('imagemin-zopfli'),
		imageminMozjpeg   = require('imagemin-mozjpeg'),
		imageminGiflossy  = require('imagemin-giflossy'),
		cache             = require('gulp-cache'),        // Подключаем библиотеку кеширования
		autoprefixer      = require('gulp-autoprefixer'), // Подключаем библиотеку для автоматического добавления префиксов
		ftp               = require('vinyl-ftp'),         // Подключаем библиотеку для деплоя проекта
		notify            = require("gulp-notify"),       // Подключаем библиотеку для информ. о найденных ошибках
		rsync             = require('gulp-rsync'),        // Подключаем библиотеку для деплоя проектов
		wait 			  = require('gulp-wait');		 // Подключаем библиотеку для задержки обновления сервера livereload



// Пользовательские скрипты проекта
gulp.task('sass', () => {
	return gulp.src('app/sass/main.sass')
	.pipe(wait(500))
	.pipe(sourcemaps.init())
	.pipe(sass({outputStyle: 'expanded'}).on("error", notify.onError()))
	.pipe(qcmq())
	.pipe(autoprefixer(['last 1 versions']))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('media', () => {
	return gulp.src('app/css/main.css')
		.pipe(qcmq())
		.pipe(gulp.dest('app/css'))
});



gulp.task('js', () => {
	return gulp.src(['app/js/**/*.js'])
		.pipe(gulp.dest('app/js'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('partial', () => {
	gulp.src(['app/_html/**/*.html'])
		.pipe(fileinclude({
		prefix: '@@',
		basepath: '@file'
		}))
		.pipe(gulp.dest('app/'))
		.pipe(browserSync.reload({stream: true}));
});


gulp.task('browser-sync', () => {
	browserSync({
		server: {
			baseDir: ["app", "app/html"]
		},
		notify: false,
		ghostMode: false
	});
});


gulp.task('imagemin', () => {
    return gulp.src(['app/img/**/*'])
        .pipe(cache(imagemin([
            //png
            imageminPngquant({
                speed: 1,
                posterize: 2
            }),
            imageminZopfli({
                more: true
                // iterations: 50 // very slow but more effective
            }),
            imageminGiflossy({
                optimizationLevel: 3,
                optimize: 3, //keep-empty: Preserve empty transparent frames
                lossy: 2
            }),
            //svg
            imagemin.svgo({
                plugins: [{
                    removeViewBox: false
                }]
            }),
            //jpg lossless
            imagemin.jpegtran({
                progressive: true
            }),
            //jpg very light lossy, use vs jpegtran
            imageminMozjpeg({
                quality: 90
            })
        ])))
        .pipe(gulp.dest('dist/img'));
});



gulp.task('watch', ['sass', 'js', 'media', 'partial', 'browser-sync'], () => {
	gulp.watch('app/sass/**/*.+(scss|sass)', ['sass']);
	gulp.watch('app/js/**/*.js', ['js']);
	gulp.watch('app/_html/**/*.html', ['partial']);
	gulp.watch('app/**/*.html', browserSync.reload);
});


gulp.task('build', ['removedist', 'sass', 'media', 'partial', 'imagemin'], () => {
	gulp.src(['app/*.html']).pipe(gulp.dest('dist'));
	gulp.src(['app/css/**/*.css',]).pipe(gulp.dest('dist/css'));
	gulp.src(['app/js/**/*.js',]).pipe(gulp.dest('dist/js'));
	gulp.src(['app/fonts/**/*',]).pipe(gulp.dest('dist/fonts'));
});


gulp.task('deploy', () => {
	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));

});



gulp.task('rsync', () => {
	return gulp.src('dist/**')
	.pipe(rsync({
		root: 'dist/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}));
});


gulp.task('removedist', () => { return del.sync('dist'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
