import {
  Router, Request, Response
} from "express";
import * as Multer from "multer";
import * as Sharp from "sharp";
import * as Tmp from "tmp";
import * as Promise from "promise";
import * as Fs from "fs";
import * as Archiver from "archiver";
import * as Path from "path";
import * as Uuid from "uuid/v4";

const router: Router = Router();
const upload: Multer.Instance = Multer({ dest: "uploads/" });
const done = {};

// util functions

// Delete property propName from object obj after 10 minutes.
function futureDelete(obj: Object, propName: string): void {
  setTimeout(() => {
    console.log(`Deleting expired job UUID ${propName}.`);
    delete obj[propName];
  }, 1000 * 60 * 10);
};

// routes

router.get("/", (req: Request, res: Response) => {
  // it's important to use redirects without initial / so that the mountpoint of the router is
  // automatically respected (it works with the user's current URL context, like <a href="bar">
  // which redirects to /foo/bar if you're already at foo); the same applies in view templates
  res.redirect("new")
});

router.get("/new", (req: Request, res: Response) => {
  res.render("new");
});

router.post("/process", upload.array("photos"), (req: Request, res: Response) => {
  let uuid = Uuid();
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

  // an additional parameter to the the callback to Tmp.dir can be a cleanupCallback which will
  // remove the temp dir (maybe only when it's empty, or perhaps some force flag needs to be passed
  // for rimraf); at any rate, since we're using the temp dir to create the zipped download and we
  // want that to remain available for some time, we'll let the OS clean up the temp dir in its own
  // time
  Tmp.dir((err, tmpDir) => {
    console.log("tmp dir: ", tmpDir);
    let outFiles = [];
    let jobs: Promise.IThenable<any>[] = [];
    // the type definition seems to be wrong here (?), it says req.files has the same type it should
    // have had we called upload.fields(); casting to any is an ugly hack to make this typecheck
    for (let file of req.files as any) {
      console.log(file);
      for (let size of sizes) {
        let outPath = `${tmpDir}/${size.width}x${size.height}_${file.originalname}`;
        outFiles.push(outPath);
        jobs.push(Sharp(file.path)
          .resize(size.width, size.height)
          .toFile(outPath));
      }
    };
    Promise.all(jobs).then(() => {
      // instead of this, trigger an async zipping of outFiles, and store the resulting zipfile in
      // done upon completion; also pass around tmpdir's cleanupCallback and call it once the
      // zipping is done
      let outZipPath = `${tmpDir}/pictures.zip`;
      let outZipStream = Fs.createWriteStream(outZipPath);
      let outZipArchive = Archiver("zip", { store: true });
      let hack = outZipArchive as any;
      outZipStream.on("close", () => {
        let bytes = hack.pointer();
        console.log(`Written ${bytes} bytes to ${outZipPath}.`);
        done[uuid] = { data: outZipPath };
        futureDelete(done, uuid);
      })
      outZipArchive.on("error", (err) => {
        console.log(`Encountered error while zipping: ${err.message}`);
        done[uuid] = { err: err.message };
        futureDelete(done, uuid);
      })
      outZipArchive.pipe(outZipStream);
      outFiles.map((file) => {
        let basename = Path.basename(file);
        hack.file(file, { name: `pictures/${basename}` });
      })
      outZipArchive.finalize();
    });
  });

  res.redirect(`status?id=${encodeURIComponent(uuid)}`);
});

router.route("/status")
  .get((req: Request, res: Response) => {
    res.render("processing");
  })
  .post((req: Request, res: Response) => {
    let uuid = req.body.uuid;
    let download = done[uuid];
    res.json({ done: !!download });
  });

router.get("/download", (req: Request, res: Response) => {
  let uuid = req.query.id;
  let download = done[uuid];

  if (!download) {
    res.send("Invalid download ID.");
  } else if (download.err) {
    res.send("Unknown error encountered during processing.");
  } else {
    let zip = download.data;
    console.log(`Sending ${zip} for download...`);
    res.download(zip);
    console.log("Done.");
  }
});

export const AppController: Router = router;
