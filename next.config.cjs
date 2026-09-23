/** @type {import('next').NextConfig} */
const nextConfig = {
	...(process.env.NODE_ENV === "development" && process.platform === "win32"
		? {
				turbopack: {
					root: process.cwd(),
				},
			}
		: {}),
	images: {
		remotePatterns: [],
	},
};

module.exports = nextConfig;
