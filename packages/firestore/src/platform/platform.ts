/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DatabaseId, DatabaseInfo } from '../core/database_info';
import { Connection } from '../remote/connection';
import { JsonProtoSerializer } from '../remote/serializer';
import { fail } from '../util/assert';
import { ConnectivityMonitor } from './../remote/connectivity_monitor';
import { BundleSource } from '../util/bundle_reader';
import { validatePositiveNumber } from '../util/input_validation';

/**
 * Provides a common interface to load anything platform dependent, e.g.
 * the connection implementation.
 *
 * An implementation of this must be provided at compile time for the platform.
 */
// TODO: Consider only exposing the APIs of 'document' and 'window' that we
// use in our client.
export interface Platform {
  loadConnection(databaseInfo: DatabaseInfo): Promise<Connection>;
  newConnectivityMonitor(): ConnectivityMonitor;
  newSerializer(databaseId: DatabaseId): JsonProtoSerializer;

  /** Formats an object as a JSON string, suitable for logging. */
  formatJSON(value: unknown): string;

  /** Converts a Base64 encoded string to a binary string. */
  atob(encoded: string): string;

  /** Converts a binary string to a Base64 encoded string. */
  btoa(raw: string): string;

  /**
   * Generates `nBytes` of random bytes.
   *
   * If `nBytes < 0` , an error will be thrown.
   */
  randomBytes(nBytes: number): Uint8Array;

  /**
   * Builds a `ByteStreamReader` from a data source.
   * @param source The data source to use.
   * @param bytesPerRead How many bytes each `read()` from the returned reader
   *        will read. It is ignored if the passed in source does not provide
   *        such control(example: ReadableStream).
   */
  toByteStreamReader(
    source: BundleSource,
    bytesPerRead: number
  ): ReadableStreamReader<Uint8Array>;

  /** The Platform's 'window' implementation or null if not available. */
  readonly window: Window | null;

  /** The Platform's 'document' implementation or null if not available. */
  readonly document: Document | null;

  /** True if and only if the Base64 conversion functions are available. */
  readonly base64Available: boolean;
}

/**
 * Builds a `ByteStreamReader` from a UInt8Array.
 * @param source The data source to use.
 * @param bytesPerRead How many bytes each `read()` from the returned reader
 *        will read.
 */
export function toByteStreamReader(
  source: Uint8Array,
  bytesPerRead: number
): ReadableStreamReader<Uint8Array> {
  validatePositiveNumber('toByteStreamReader', 2, bytesPerRead);
  let readFrom = 0;
  const reader: ReadableStreamReader<Uint8Array> = {
    async read(): Promise<ReadableStreamReadResult<Uint8Array>> {
      if (readFrom < source.byteLength) {
        const result = {
          value: source.slice(readFrom, readFrom + bytesPerRead),
          done: false
        };
        readFrom += bytesPerRead;
        return result;
      }

      return { value: undefined, done: true };
    },
    async cancel(): Promise<void> {},
    releaseLock() {}
  };
  return reader;
}

/**
 * Provides singleton helpers where setup code can inject a platform at runtime.
 * setPlatform needs to be set before Firestore is used and must be set exactly
 * once.
 */
export class PlatformSupport {
  private static platform: Platform;
  static setPlatform(platform: Platform): void {
    if (PlatformSupport.platform) {
      fail('Platform already defined');
    }
    PlatformSupport.platform = platform;
  }

  static getPlatform(): Platform {
    if (!PlatformSupport.platform) {
      fail('Platform not set');
    }
    return PlatformSupport.platform;
  }
}
