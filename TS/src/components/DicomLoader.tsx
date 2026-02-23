import React from 'react';
import dicomParser from 'dicom-parser';
import { Slice } from '../volume/Volume';

interface Props {
  onVolumeSlices: (slices: Slice[], metadata: Record<string, string | number | undefined>) => void;
}

const DicomLoader: React.FC<Props> = ({ onVolumeSlices }) => {
  const onFiles = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;

    const slices: Slice[] = [];
    const metadata: Record<string, string | number | undefined> = {};

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const ab = await f.arrayBuffer();
        const byteArray = new Uint8Array(ab);
        const dataSet = dicomParser.parseDicom(byteArray);

        const rows = dataSet.uint16('x00280010') || dataSet.intString('x00280010') || 0;
        const cols = dataSet.uint16('x00280011') || dataSet.intString('x00280011') || 0;
        const bits = dataSet.uint16('x00280100') || 8;
        const instance = parseInt(dataSet.string('x00200013') || '') || undefined;
        const imagePosStr = dataSet.string('x00200032') || undefined; // ImagePositionPatient
        let imagePos: number | undefined = undefined;
        if (imagePosStr) {
          const parts = imagePosStr.split(' ').map(Number);
          if (parts.length >= 3) imagePos = parts[2];
        }

        // pixel data
        const pixelElement = dataSet.elements.x7fe00010;
        let pixelData: Uint8Array | Uint16Array = new Uint8Array(0);
        if (pixelElement) {
          const offset = pixelElement.dataOffset;
          const length = pixelElement.length;
          const imgBuf = byteArray.subarray(offset, offset + length);
          // If bitsAllocated > 8, treat as Uint16
          if (bits > 8) {
            // create Uint16 from little-endian bytes
            const u16 = new Uint16Array(imgBuf.buffer.slice(imgBuf.byteOffset, imgBuf.byteOffset + imgBuf.byteLength));
            pixelData = u16;
          } else {
            pixelData = new Uint8Array(imgBuf);
          }
        }

        // collect metadata (first file used as representative)
        if (i === 0) {
          metadata['PatientName'] = dataSet.string('x00100010') || undefined;
          metadata['StudyDate'] = dataSet.string('x00080020') || undefined;
          metadata['Modality'] = dataSet.string('x00080060') || undefined;
          metadata['Rows'] = rows;
          metadata['Columns'] = cols;
          metadata['BitsAllocated'] = bits;
        }

        slices.push({
          instanceNumber: instance,
          imagePosition: imagePos,
          rows: Number(rows),
          cols: Number(cols),
          bitsAllocated: Number(bits),
          pixelData,
        });
      } catch (err) {
        // ignore parse errors per-file
        // eslint-disable-next-line no-console
        console.warn('Failed to parse DICOM file', f.name, err);
      }
    }

    onVolumeSlices(slices, metadata);
  };

  // Extend input attributes to allow non-standard folder-selection props
  type FolderInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
  };

  const folderProps: FolderInputProps = {
    type: 'file',
    webkitdirectory: '',
    directory: '',
    multiple: true,
    onChange: onFiles,
  };

  return (
    <div className="dicom-loader">
      <label className="button">
        Select DICOM Folder
        <input {...(folderProps as React.InputHTMLAttributes<HTMLInputElement>)} />
      </label>
    </div>
  );
};

export default DicomLoader;
