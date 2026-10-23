import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignatureFormProps {
  onComplete: (signature: string) => void;
}

const SignatureForm: React.FC<SignatureFormProps> = ({ onComplete }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setSignature(null);
  };

  const handleSave = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        alert('Please provide a signature');
        return;
      }

      const dataURL = sigCanvas.current.toDataURL('image/png');
      setSignature(dataURL);
      onComplete(dataURL);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-bold">Please sign below</h2>
      <div className="border border-gray-300 rounded">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 500,
            height: 200,
            className: 'signature-canvas'
          }}
        />
      </div>
      <div className="flex space-x-4">
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={handleSave}>Save Signature</Button>
      </div>
      {signature && (
        <div>
          <p>Signature Preview:</p>
          <img src={signature} alt="Signature" className="border border-gray-300 mt-2" />
        </div>
      )}
    </div>
  );
};

export default SignatureForm;