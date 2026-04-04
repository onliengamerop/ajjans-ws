export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const servers = [
        {
            jobId: "putYourEncryptedJobIdHere",
            brainrot: "Server One",
            mps: "40m/s"
        }
    ];
    res.status(200).json(servers);
}
