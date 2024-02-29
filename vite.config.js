import * as fs from 'fs';
import path, { resolve } from 'path';
import { defineConfig } from 'vite';

const title = 'Ocean Test By Cu';

const bannerPlugin = (banner) => {
  return {
    name: 'banner',
    async writeBundle (NULL, bundle) {
      for (const fileName of Object.entries(bundle)) {
        const file = fileName[0]
        const extRegex = new RegExp(/\.(css|js)$/i)
        const vendorRegex = new RegExp(/vendor/)
        if (extRegex.test(file) && !vendorRegex.test(file)) {
          let data = fs.readFileSync('./build/' + file, { encoding: 'utf8' })
          data = `/* ${banner} */ ${data}`
          fs.writeFileSync('./build/' + file, data)
        }
      }
    }
  }
}

const dateFormat = (date) => {
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours();
	let minute = date.getMinutes();
	let second = date.getSeconds();

	month = month >= 10 ? month : '0' + month;
	day = day >= 10 ? day : '0' + day;
	hour = hour >= 10 ? hour : '0' + hour;
	minute = minute >= 10 ? minute : '0' + minute;
	second = second >= 10 ? second : '0' + second;

	return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

export default defineConfig({
	base: '',
	build: {
		cssMinify: false,
		outDir: './build',
		rollupOptions: {
			input: {
        main: resolve(__dirname, '/index.html'),
      },
			output: {
				assetFileNames: (assetInfo) => {
					let extType = (assetInfo.name.match(/\.([a-z0-9]+)$/i) || [])[1];
					if (/(css)/i.test(extType)) {
						return `resources/${extType}/[name][extname]`;
					} else if (/(png|jpe?g|svg|gif|tiff|bmp|ico)/i.test(extType)) {
						extType = 'images';
					} else if (/(woff2|woff2|otf|ttf)/i.test(extType)) {
						extType = 'fonts';
					}
					return `resources/${extType}/[name][extname]`;
				},
				chunkFileNames: 'resources/js/[name].js',
				entryFileNames: 'resources/js/[name].js'
			}
		}
	},
  plugins: [
		bannerPlugin(`
* @project  ${title}
* @author   www.fave.kr
* @build    ${dateFormat(new Date())}
`),
  ],
});
