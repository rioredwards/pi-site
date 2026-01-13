function defineWindowUrlIfNotDefined() {
  if (typeof window === "undefined") return;

  window.URL = window.URL || window.webkitURL;
}

function defineCanvasToBlobIfNotDefined() {
  if (typeof window === "undefined") return;

  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function (callback: BlobCallback, type?: string, quality?: any) {
        const binStr = atob(this.toDataURL(type, quality).split(",")[1]),
          len = binStr.length,
          arr = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }

        callback(new Blob([arr], { type: type || "image/png" }));
      },
    });
  }
}

// Modified from https://stackoverflow.com/a/32490603, cc by-sa 3.0
// -2 = not jpeg, -1 = no data, 1..8 = orientations
function getExifOrientation(file: Blob, callback: (orientation: number) => void) {
  // Suggestion from http://code.flickr.net/2012/06/01/parsing-exif-client-side-using-javascript-2/:
  if (file.slice) {
    file = file.slice(0, 131072);
  } else if ((file as unknown as any).webkitSlice) {
    file = (file as unknown as any).webkitSlice(0, 131072);
  }

  const reader = new FileReader();
  reader.onload = function (e: ProgressEvent<FileReader>) {
    const view = new DataView(e.target!.result as ArrayBuffer);
    if (view.getUint16(0, false) != 0xffd8) {
      callback(-2);
      return;
    }
    const length = view.byteLength;
    let offset = 2;
    while (offset < length) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xffe1) {
        if (view.getUint32((offset += 2), false) != 0x45786966) {
          callback(-1);
          return;
        }
        const little = view.getUint16((offset += 6), false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        const tags = view.getUint16(offset, little);
        offset += 2;
        for (let i = 0; i < tags; i++)
          if (view.getUint16(offset + i * 12, little) == 0x0112) {
            callback(view.getUint16(offset + i * 12 + 8, little));
            return;
          }
      } else if ((marker & 0xff00) != 0xff00) break;
      else offset += view.getUint16(offset, false);
    }
    callback(-1);
  };
  reader.readAsArrayBuffer(file);
}

// Derived from https://stackoverflow.com/a/40867559, cc by-sa
function imgToCanvas(
  img: HTMLImageElement,
  rawWidth: number,
  rawHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rawWidth;
  canvas.height = rawHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, rawWidth, rawHeight);
  return canvas;
}

export function reduceFileSize(
  file: Blob,
  acceptFileSize: number,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  defineWindowUrlIfNotDefined();
  defineCanvasToBlobIfNotDefined();

  return new Promise((resolve, reject) => {
    if (file.size <= acceptFileSize) {
      resolve(file);
      return;
    }
    const img = new Image();
    img.onerror = function () {
      URL.revokeObjectURL(this.src);
      reject(new Error("Image loading error"));
    };
    img.onload = function () {
      URL.revokeObjectURL((this as HTMLImageElement).src);
      getExifOrientation(file, function (orientation) {
        let w = img.width,
          h = img.height;

        // const scale = Math.min(maxWidth / w, maxHeight / h, 1);
        const scale =
          orientation > 4
            ? Math.min(maxHeight / w, maxWidth / h, 1)
            : Math.min(maxWidth / w, maxHeight / h, 1);
        h = Math.round(h * scale);
        w = Math.round(w * scale);

        const canvas = imgToCanvas(img, w, h);
        canvas.toBlob(
          function (blob) {
            if (blob) {
              if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.log("Resized image to " + w + "x" + h + ", " + (blob.size >> 10) + "kB");
              }
              resolve(blob);
            } else {
              reject(new Error("Blob creation error"));
            }
          },
          "image/jpeg",
          quality
        );
      });
    };
    img.src = URL.createObjectURL(file);
  });
}
