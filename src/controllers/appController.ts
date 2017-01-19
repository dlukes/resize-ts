import {
  Router, Request, Response
} from "express";
import * as Multer from "multer";
import * as Sharp from "sharp";
import * as Tmp from "tmp";

const router: Router = Router();
const upload: Multer.Instance = Multer({ dest: "uploads/" });

router.get("/", (req: Request, res: Response) => {
  // it's important to use redirects without initial / so that the mountpoint of the router is
  // automatically respected (it works with the user's current URL context, like <a href="bar">
  // which redirects to /foo/bar if you're already at foo); the same applies in view templates
  res.redirect("new")
});

router.get("/new", (req: Request, res: Response) => {
    res.render("index");
});

router.post("/process", upload.array("photos"), (req: Request, res: Response) => {
  console.log("========================================");
  console.log(Date());
  console.log(req.body);
  let sizes = req.body.sizes.trim().split(/ +/).map((sizeString) => {
    // the lambda wrapper around parseInt is necessary to discard the additional parameters that
    // .map() would otherwise pass it and that parseInt would interpret as the radix, producing NaNs
    let [width, height] = sizeString.split("x").map((x) => parseInt(x));
    return { width, height };
  });
  console.log(sizes);

  Tmp.dir((err, tmpDir, cleanupCallback) => {
    console.log("tmp dir: ", tmpDir);
    let outFiles = [];
    // the type definition seems to be wrong here (?), it says req.files has the same type it should
    // have had we called upload.fields(); casting to any is an ugly hack to make this typecheck
    for (let file of req.files as any) {
      console.log(file);
      for (let size of sizes) {
        let outPath = `${tmpDir}/${size.width}x${size.height}_${file.originalname}`;
        outFiles.push(outPath);
        Sharp(file.path)
          .resize(size.width, size.height)
          .toFile(outPath);
      }
    };
    // this fails obviously, Sharp returns a Promise and handles the conversion asynchronously,
    // which means we have a race condition here (the file won't be ready that soon)
    let last = outFiles.pop();
    console.log(`Downloading ${last}...`);
    res.download(last);
    console.log("Downloaded.");
    // cleanupCallback();
  });
});

export const AppController: Router = router;
