export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const servers = [
        {
            jobId: "putYourEncryptedJobIdHere",
            brainrot: "Server One",
            mps: "40m/s"
        },
        {
            jobId: "putYourEncryptedJobIdHere2",
            brainrot: "Server Two",
            mps: "1b/s"
        }
    ];
    
    res.status(200).json(servers);
}
