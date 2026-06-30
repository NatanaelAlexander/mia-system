export interface R2Config {
  endpointUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export function loadR2Config(): R2Config {
  return {
    endpointUrl: process.env.R2_ENDPOINT_URL?.trim() ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() ?? '',
    bucket: process.env.R2_BUCKET_SYSTEM?.trim() ?? '',
  };
}

export function isR2Configured(config: R2Config): boolean {
  return Boolean(
    config.endpointUrl &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket,
  );
}
