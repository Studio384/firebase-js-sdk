/**
 * @license
 * Copyright 2020 Google LLC
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

/** Return the Platform-specific serializer monitor. */
import { JsonProtoSerializer } from '../../remote/serializer';
import { DatabaseId } from '../../core/database_info';

export function newSerializer(databaseId: DatabaseId): JsonProtoSerializer {
  return new JsonProtoSerializer(databaseId, /* useProto3Json= */ false);
}

export function newRestSerializer(databaseId: DatabaseId): JsonProtoSerializer {
  return new JsonProtoSerializer(databaseId, /* useProto3Json= */ true);
}
