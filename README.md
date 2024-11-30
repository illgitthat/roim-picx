# roim-picx

### An image hosting application based on Cloudflare's Worker, R2, and Pages with the following features:

* 10GB of free storage space
* 3 million image accesses per month without traffic counting, with a daily limit of 100,000.
* 1 million image uploads per month
* No need to purchase your own server, just clone the code and deploy on Cloudflare.
* Independent deployment without worrying about third-party data deletion.

### Features Implemented

* Batch image upload
* Image list query
* Image deletion
* Directory creation
* Query by directory
* Click to copy link address
* Simple authentication function, authorization required to enter the management page

### Usage Tutorial

1. Fork the project to your own GitHub
2. Create a Pages project
3. Enter build parameters

    1. Framework preset: None
    2. Build command: `npm run build`
    3. Output directory: `dist`
4. Complete the creation
5. Set environment variables

    1. `AUTH_TOKEN`: Authorization code
    2. `COPY_URL`: Path to copy, if none, enter `https://domain.com/i`
6. Bind R2

    1. Variable name: `R2`
7. Redeploy

---

Project forked from [roimdev/roim-picx](https://github.com/roimdev/roim-picx) and [liangliangle/roim-picx](https://github.com/liangliangle/roim-picx)
