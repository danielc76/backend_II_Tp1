function logger(req, res, next) {
    const startTime = Date.now();

    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log(
            `[RESPONSE] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Time: ${duration} ms`
        );
    });

    next();
}

export default logger;
