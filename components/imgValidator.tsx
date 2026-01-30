"use client";

import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { analyzeImageAction } from "../app/actions";
import type { AnalysisResult } from "../app/lib/imgValidatorTypes";

export default function ImgValidator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await analyzeImageAction(formData);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-4xl font-bold">Image Analysis</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="rounded-lg bg-gray-800 p-6">
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium">
                Select Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full cursor-pointer text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
            </label>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <BounceLoader color={"#ffffff"} loading={true} size={20} />
                  <span>Analyzing...</span>
                </span>
              ) : (
                "Analyze Image"
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-600 bg-red-900/50 p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {preview && (
          <div className="mb-6 rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Preview</h2>
            <div className="flex justify-center">
              <Image
                width={100}
                height={100}
                src={preview}
                alt="Preview"
                className="max-h-96 max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Analysis Results</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* NSFW Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">NSFW Score</span>
                  <span
                    className={`font-semibold ${
                      result.is_nsfw ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {result.nsfw_score.toFixed(4)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.is_nsfw ? "bg-red-500" : "bg-gray-600"
                    }`}
                    style={{ width: `${result.nsfw_score * 100}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  {result.is_nsfw ? (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                      NSFW
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                      SFW
                    </span>
                  )}
                </div>
              </div>

              {/* Dog Probability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Dog Probability</span>
                  <span
                    className={`font-semibold ${
                      result.is_dog ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {result.dog_probability.toFixed(4)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.is_dog ? "bg-green-500" : "bg-gray-600"
                    }`}
                    style={{ width: `${result.dog_probability * 100}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  {result.is_dog && (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                      DOG
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
