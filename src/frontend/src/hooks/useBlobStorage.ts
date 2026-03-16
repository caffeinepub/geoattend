import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useRef } from "react";
import { ExternalBlob } from "../backend";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

export interface BlobStorageHook {
  store: (blob: ExternalBlob) => Promise<ExternalBlob>;
}

export function useBlobStorage(): BlobStorageHook {
  const { identity } = useInternetIdentity();
  const storageClientRef = useRef<StorageClient | null>(null);

  const getClient = useCallback(async (): Promise<StorageClient> => {
    if (storageClientRef.current) return storageClientRef.current;
    const config = await loadConfig();
    const agent = new HttpAgent({
      identity: identity ?? undefined,
      host: config.backend_host,
    });
    const client = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    storageClientRef.current = client;
    return client;
  }, [identity]);

  const store = useCallback(
    async (blob: ExternalBlob): Promise<ExternalBlob> => {
      const client = await getClient();
      const bytes = await blob.getBytes();
      const { hash } = await client.putFile(bytes, blob.onProgress);
      const url = await client.getDirectURL(hash);
      return ExternalBlob.fromURL(url);
    },
    [getClient],
  );

  return { store };
}
