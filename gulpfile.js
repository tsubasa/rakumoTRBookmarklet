/* eslint-disable no-console */

const fs = require('fs');

const gulp = require('gulp');
const insert = require('gulp-insert');
const jest = require('gulp-jest').default;
const replace = require('gulp-replace');
const closureCompiler = require('google-closure-compiler').gulp({ jsMode: true });

const tmpJsPath = './src/tmp.js';

// テスト
gulp.task('jest', (callback) => {
	return gulp.src('./test/')
		.pipe(jest({
			roots: ['<rootDir>/test/'],
			transform: {
				'^.+\\.js$': 'babel-jest'
			},
			transformIgnorePatterns: ['/node_modules/'],
			verbose: true
		}));
});

// コンパイル
gulp.task('closure-compile', () => {
	const copyFile = (filePath, outPath) => {
		return new Promise((resolve) => {
			fs.copyFile(filePath, outPath, (err) => {
				if (err) {
					throw err;
				}
				resolve();
			});
		})
	}

	const readFile = (filePath) => {
		return new Promise((resolve) => {
			fs.readFile(filePath, 'utf8', (err, data) => {
				if (err) {
					throw err;
				}
				resolve(data);
			});
		})
	}

	const appendFile = (filePath, data) => {
		return new Promise((resolve) => {
			fs.appendFile(filePath, data, (err) => {
				if (err) {
					throw err;
				}
				resolve();
			});
		})
	}

	const callback = () => {
		return new Promise((resolve) => {
			gulp.src(tmpJsPath)
			.pipe(closureCompiler({
				compilation_level: 'ADVANCED',
				warning_level: 'VERBOSE',
				language_in: 'ECMASCRIPT6_STRICT',
				language_out: 'ECMASCRIPT6_STRICT',
				js_output_file: 'bookmarklet.js'
			}))
			.pipe(replace(/\r?\n/g, ''))
			.pipe(insert.wrap('javascript:(function(){', '})();')) // eslint-disable-line no-script-url
			.pipe(gulp.dest('dist'))
			.on('end', () => {
				fs.unlink(tmpJsPath, (err) => {
					if (err && err.code === 'ENOENT') {
						console.info("File doesn't exist, won't remove it.");
					} else if (err) {
						console.error('Error occurred while trying to remove file');
					}
				});
				resolve();
			});
		})
	}

	// app.jsとclasses.jsを結合して出力しコンパイル
	const exec = async () => {
		let data = '';
		await copyFile('./src/app.js', tmpJsPath);
		data = await readFile('./src/classes.js');
		data = data.replace(/export default/, '//'); // ES6記述をコメントアウトで無効化
		await appendFile(tmpJsPath, data);
		await callback();
	}

	exec();
});
