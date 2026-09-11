import{F as Te,L as Ae,u as Ie,e as we,m as Ce,g as ye,t as Ne,i as Le,C as be,r as J,a2 as Pe}from"./index.esm-vweQIQRC.js";var K="@firebase/ai",H="2.16.0";/**
 * @license
 * Copyright 2024 Google LLC
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
 */const w="AI",Me="us-central1",De="global",ie="firebasevertexai.googleapis.com",P="v1beta",Q=H,ve="gl-js",ke="hybrid",Ue=180*1e3,xe="gemini-2.5-flash-lite";/**
 * @license
 * Copyright 2024 Google LLC
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
 */class c extends Te{constructor(e,t,s){const o=w,i=`${o}/${e}`,a=`${o}: ${t} (${i})`;super(e,a),this.code=e,this.customErrorData=s,Error.captureStackTrace&&Error.captureStackTrace(this,c),Object.setPrototypeOf(this,c.prototype),this.toString=()=>a}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */const X=["user","model","function","system"],vt={HARM_CATEGORY_HATE_SPEECH:"HARM_CATEGORY_HATE_SPEECH",HARM_CATEGORY_SEXUALLY_EXPLICIT:"HARM_CATEGORY_SEXUALLY_EXPLICIT",HARM_CATEGORY_HARASSMENT:"HARM_CATEGORY_HARASSMENT",HARM_CATEGORY_DANGEROUS_CONTENT:"HARM_CATEGORY_DANGEROUS_CONTENT"},kt={BLOCK_LOW_AND_ABOVE:"BLOCK_LOW_AND_ABOVE",BLOCK_MEDIUM_AND_ABOVE:"BLOCK_MEDIUM_AND_ABOVE",BLOCK_ONLY_HIGH:"BLOCK_ONLY_HIGH",BLOCK_NONE:"BLOCK_NONE",OFF:"OFF"},Ut={SEVERITY:"SEVERITY",PROBABILITY:"PROBABILITY"},xt={NEGLIGIBLE:"NEGLIGIBLE",LOW:"LOW",MEDIUM:"MEDIUM",HIGH:"HIGH"},ae={HARM_SEVERITY_NEGLIGIBLE:"HARM_SEVERITY_NEGLIGIBLE",HARM_SEVERITY_LOW:"HARM_SEVERITY_LOW",HARM_SEVERITY_MEDIUM:"HARM_SEVERITY_MEDIUM",HARM_SEVERITY_HIGH:"HARM_SEVERITY_HIGH",HARM_SEVERITY_UNSUPPORTED:"HARM_SEVERITY_UNSUPPORTED"},Gt={SAFETY:"SAFETY",OTHER:"OTHER",BLOCKLIST:"BLOCKLIST",PROHIBITED_CONTENT:"PROHIBITED_CONTENT"},g={STOP:"STOP",MAX_TOKENS:"MAX_TOKENS",SAFETY:"SAFETY",RECITATION:"RECITATION",OTHER:"OTHER",BLOCKLIST:"BLOCKLIST",PROHIBITED_CONTENT:"PROHIBITED_CONTENT",SPII:"SPII",MALFORMED_FUNCTION_CALL:"MALFORMED_FUNCTION_CALL",IMAGE_SAFETY:"IMAGE_SAFETY",IMAGE_PROHIBITED_CONTENT:"IMAGE_PROHIBITED_CONTENT",IMAGE_OTHER:"IMAGE_OTHER",NO_IMAGE:"NO_IMAGE",IMAGE_RECITATION:"IMAGE_RECITATION",LANGUAGE:"LANGUAGE",UNEXPECTED_TOOL_CALL:"UNEXPECTED_TOOL_CALL",TOO_MANY_TOOL_CALLS:"TOO_MANY_TOOL_CALLS",MISSING_THOUGHT_SIGNATURE:"MISSING_THOUGHT_SIGNATURE",MALFORMED_RESPONSE:"MALFORMED_RESPONSE"},Ft={SQUARE_1x1:"1:1",PORTRAIT_9x16:"9:16",LANDSCAPE_16x9:"16:9",PORTRAIT_3x4:"3:4",LANDSCAPE_4x3:"4:3",PORTRAIT_2x3:"2:3",LANDSCAPE_3x2:"3:2",PORTRAIT_4x5:"4:5",LANDSCAPE_5x4:"5:4",PORTRAIT_1x4:"1:4",LANDSCAPE_4x1:"4:1",PORTRAIT_1x8:"1:8",LANDSCAPE_8x1:"8:1",ULTRAWIDE_21x9:"21:9"},Ht={SIZE_512:"512",SIZE_1K:"1K",SIZE_2K:"2K",SIZE_4K:"4K"},$t={AUTO:"AUTO",ANY:"ANY",NONE:"NONE"},Vt={MODALITY_UNSPECIFIED:"MODALITY_UNSPECIFIED",TEXT:"TEXT",IMAGE:"IMAGE",VIDEO:"VIDEO",AUDIO:"AUDIO",DOCUMENT:"DOCUMENT"},Bt={TEXT:"TEXT",IMAGE:"IMAGE",AUDIO:"AUDIO"},_={PREFER_ON_DEVICE:"prefer_on_device",ONLY_ON_DEVICE:"only_on_device",ONLY_IN_CLOUD:"only_in_cloud",PREFER_IN_CLOUD:"prefer_in_cloud"},A={ON_DEVICE:"on_device",IN_CLOUD:"in_cloud"},Yt={UNSPECIFIED:"OUTCOME_UNSPECIFIED",OK:"OUTCOME_OK",FAILED:"OUTCOME_FAILED",DEADLINE_EXCEEDED:"OUTCOME_DEADLINE_EXCEEDED"},jt={UNSPECIFIED:"LANGUAGE_UNSPECIFIED",PYTHON:"PYTHON"},Wt={MINIMAL:"MINIMAL",LOW:"LOW",MEDIUM:"MEDIUM",HIGH:"HIGH"};/**
 * @license
 * Copyright 2024 Google LLC
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
 */const qt={URL_RETRIEVAL_STATUS_UNSPECIFIED:"URL_RETRIEVAL_STATUS_UNSPECIFIED",URL_RETRIEVAL_STATUS_SUCCESS:"URL_RETRIEVAL_STATUS_SUCCESS",URL_RETRIEVAL_STATUS_ERROR:"URL_RETRIEVAL_STATUS_ERROR",URL_RETRIEVAL_STATUS_PAYWALL:"URL_RETRIEVAL_STATUS_PAYWALL",URL_RETRIEVAL_STATUS_UNSAFE:"URL_RETRIEVAL_STATUS_UNSAFE"},N={SERVER_CONTENT:"serverContent",TOOL_CALL:"toolCall",TOOL_CALL_CANCELLATION:"toolCallCancellation",GOING_AWAY_NOTICE:"goingAwayNotice",SESSION_RESUMPTION_UPDATE:"sessionResumptionUpdate"};/**
 * @license
 * Copyright 2024 Google LLC
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
 */const l={ERROR:"error",REQUEST_ERROR:"request-error",RESPONSE_ERROR:"response-error",FETCH_ERROR:"fetch-error",SESSION_CLOSED:"session-closed",INVALID_CONTENT:"invalid-content",API_NOT_ENABLED:"api-not-enabled",INVALID_SCHEMA:"invalid-schema",NO_API_KEY:"no-api-key",NO_APP_ID:"no-app-id",NO_MODEL:"no-model",NO_PROJECT_ID:"no-project-id",PARSE_FAILED:"parse-failed",UNSUPPORTED:"unsupported"};/**
 * @license
 * Copyright 2024 Google LLC
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
 */const C={STRING:"string",NUMBER:"number",INTEGER:"integer",BOOLEAN:"boolean",ARRAY:"array",OBJECT:"object"};/**
 * @license
 * Copyright 2024 Google LLC
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
 */const S={AGENT_PLATFORM:"AGENT_PLATFORM",VERTEX_AI:"VERTEX_AI",GOOGLE_AI:"GOOGLE_AI"};/**
 * @license
 * Copyright 2025 Google LLC
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
 */class ${constructor(e){this.backendType=e}}class V extends ${constructor(){super(S.GOOGLE_AI)}_getModelPath(e,t){return`/${P}/projects/${e}/${t}`}_getTemplatePath(e,t){return`/${P}/projects/${e}/templates/${t}`}}class B extends ${constructor(e){super(S.VERTEX_AI),this.location=Me,e&&(this.location=e)}_getModelPath(e,t){return`/${P}/projects/${e}/locations/${this.location}/${t}`}_getTemplatePath(e,t){return`/${P}/projects/${e}/locations/${this.location}/templates/${t}`}}class Y extends ${constructor(e){super(S.AGENT_PLATFORM),this.location=De,e&&(this.location=e)}_getModelPath(e,t){return`/${P}/projects/${e}/locations/${this.location}/${t}`}_getTemplatePath(e,t){return`/${P}/projects/${e}/locations/${this.location}/templates/${t}`}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */function Ge(n){if(n instanceof V)return`${w}/googleai`;if(n instanceof B)return`${w}/vertexai/${n.location}`;if(n instanceof Y)return`${w}/agentplatform/${n.location}`;throw new c(l.ERROR,`Invalid backend: ${JSON.stringify(n.backendType)}`)}function Fe(n){const e=n.split("/");if(e[0]!==w)throw new c(l.ERROR,`Invalid instance identifier, unknown prefix '${e[0]}'`);switch(e[1]){case"vertexai":const s=e[2];if(!s)throw new c(l.ERROR,`Invalid instance identifier, unknown location '${n}'`);return new B(s);case"agentplatform":const o=e[2];if(!o)throw new c(l.ERROR,`Invalid instance identifier, unknown location '${n}'`);return new Y(o);case"googleai":return new V;default:throw new c(l.ERROR,`Invalid instance identifier string: '${n}'`)}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */const h=new Ae("@firebase/vertexai");var T;(function(n){n.UNAVAILABLE="unavailable",n.DOWNLOADABLE="downloadable",n.DOWNLOADING="downloading",n.AVAILABLE="available"})(T||(T={}));/**
 * @license
 * Copyright 2025 Google LLC
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
 */const re={type:"text",languages:["en"]},U=[re,{type:"image"}],x=[re];class O{constructor(e,t,s){this.languageModelProvider=e,this.mode=t,this.downloadPromise=null,this.onDeviceParams={createOptions:{expectedInputs:U,expectedOutputs:x}},s&&(this.onDeviceParams=s,this.onDeviceParams.createOptions?(this.onDeviceParams.createOptions.expectedInputs||(this.onDeviceParams.createOptions.expectedInputs=U),this.onDeviceParams.createOptions.expectedOutputs||(this.onDeviceParams.createOptions.expectedOutputs=x)):this.onDeviceParams.createOptions={expectedInputs:U,expectedOutputs:x})}async isAvailable(e){var s;if(!this.mode)return h.debug("On-device inference unavailable because mode is undefined."),!1;if(this.mode===_.ONLY_IN_CLOUD)return h.debug('On-device inference unavailable because mode is "only_in_cloud".'),!1;const t=await((s=this.languageModelProvider)==null?void 0:s.availability(this.onDeviceParams.createOptions));if(this.mode===_.ONLY_ON_DEVICE){if(t===T.UNAVAILABLE)throw new c(l.API_NOT_ENABLED,"Local LanguageModel API not available in this environment.");if(t===T.DOWNLOADABLE||t===T.DOWNLOADING){h.debug("Waiting for download of LanguageModel to complete.");try{await this.downloadPromise}catch(o){throw new c(l.ERROR,o.message)}return!0}return!0}return t!==T.AVAILABLE?(h.debug(`On-device inference unavailable because availability is "${t}".`),!1):O.isOnDeviceRequest(e)?!0:(h.debug("On-device inference unavailable because request is incompatible."),!1)}async generateContent(e){const t=await this.createSession(),s=await Promise.all(e.contents.map(O.toLanguageModelMessage)),o=await t.prompt(s,this.onDeviceParams.promptOptions);return O.toResponse(o)}async generateContentStream(e){const t=await this.createSession(),s=await Promise.all(e.contents.map(O.toLanguageModelMessage)),o=t.promptStreaming(s,this.onDeviceParams.promptOptions);return O.toStreamResponse(o)}async countTokens(e){throw new c(l.REQUEST_ERROR,"Count Tokens is not yet available for on-device model.")}static isOnDeviceRequest(e){if(e.contents.length===0)return h.debug("Empty prompt rejected for on-device inference."),!1;for(const t of e.contents){if(t.parts.some(s=>"functionResponse"in s))return h.debug("Content with a function response part rejected for on-device inference."),!1;for(const s of t.parts)if(s.inlineData&&O.SUPPORTED_MIME_TYPES.indexOf(s.inlineData.mimeType)===-1)return h.debug(`Unsupported mime type "${s.inlineData.mimeType}" rejected for on-device inference.`),!1}return!0}async downloadIfAvailable(e){var s;const t=await((s=this.languageModelProvider)==null?void 0:s.availability(this.onDeviceParams.createOptions));return(t===T.DOWNLOADABLE||t===T.DOWNLOADING)&&this.download(e),t}download(e){var s;if(this.downloadPromise)return;const t={...this.onDeviceParams.createOptions};t&&!t.monitor&&e&&(t.monitor=o=>{o.addEventListener("downloadprogress",i=>{e(i.loaded)})}),this.downloadPromise=(s=this.languageModelProvider)==null?void 0:s.create(t).finally(()=>{this.downloadPromise=null})}static async toLanguageModelMessage(e){const t=await Promise.all(e.parts.map(O.toLanguageModelMessageContent));return{role:O.toLanguageModelMessageRole(e.role),content:t}}static async toLanguageModelMessageContent(e){if(e.text)return{type:"text",value:e.text};if(e.inlineData){const s=await(await fetch(`data:${e.inlineData.mimeType};base64,${e.inlineData.data}`)).blob();return{type:"image",value:await createImageBitmap(s)}}throw new c(l.REQUEST_ERROR,"Processing of this Part type is not currently supported.")}static toLanguageModelMessageRole(e){return e==="model"?"assistant":"user"}async createSession(){if(!this.languageModelProvider)throw new c(l.UNSUPPORTED,"Chrome AI requested for unsupported browser version.");const e=await this.languageModelProvider.create(this.onDeviceParams.createOptions);return this.oldSession&&this.oldSession.destroy(),this.oldSession=e,e}static toResponse(e){return{json:async()=>({candidates:[{content:{parts:[{text:e}]}}]})}}static toStreamResponse(e){const t=new TextEncoder;return{body:e.pipeThrough(new TransformStream({transform(s,o){const i=JSON.stringify({candidates:[{content:{role:"model",parts:[{text:s}]}}]});o.enqueue(t.encode(`data: ${i}

`))}}))}}}O.SUPPORTED_MIME_TYPES=["image/jpeg","image/png"];function He(n,e,t){const o=(e||Pe()).LanguageModel;if(o&&n)return new O(o,n,t)}/**
 * @license
 * Copyright 2024 Google LLC
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
 */class $e{constructor(e,t,s,o,i){this.app=e,this.backend=t,this.chromeAdapterFactory=i;const a=o==null?void 0:o.getImmediate({optional:!0}),r=s==null?void 0:s.getImmediate({optional:!0});this.auth=r||null,this.appCheck=a||null,t instanceof B||t instanceof Y?this.location=t.location:this.location=""}_delete(){return Promise.resolve()}set options(e){this._options=e}get options(){return this._options}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */function Ve(n,{instanceIdentifier:e}){if(!e)throw new c(l.ERROR,"AIService instance identifier is undefined.");const t=Fe(e),s=n.getProvider("app").getImmediate(),o=n.getProvider("auth-internal"),i=n.getProvider("app-check-internal");return new $e(s,t,o,i,He)}/**
 * @license
 * Copyright 2025 Google LLC
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
 */function ce(n){var t,s,o,i,a,r,u;if((s=(t=n.app)==null?void 0:t.options)!=null&&s.apiKey)if((i=(o=n.app)==null?void 0:o.options)!=null&&i.projectId){if(!((r=(a=n.app)==null?void 0:a.options)!=null&&r.appId))throw new c(l.NO_APP_ID,'The "appId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid app ID.')}else throw new c(l.NO_PROJECT_ID,'The "projectId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid project ID.');else throw new c(l.NO_API_KEY,'The "apiKey" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid API key.');const e={apiKey:n.app.options.apiKey,project:n.app.options.projectId,appId:n.app.options.appId,automaticDataCollectionEnabled:n.app.automaticDataCollectionEnabled,location:n.location,backend:n.backend};if(ye(n.app)&&n.app.settings.appCheckToken){const d=n.app.settings.appCheckToken;e.getAppCheckToken=()=>Promise.resolve({token:d})}else n.appCheck&&((u=n.options)!=null&&u.useLimitedUseAppCheckTokens?e.getAppCheckToken=()=>n.appCheck.getLimitedUseToken():e.getAppCheckToken=()=>n.appCheck.getToken());return n.auth&&(e.getAuthToken=()=>n.auth.getToken()),e}/**
 * @license
 * Copyright 2025 Google LLC
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
 */class b{constructor(e,t){this._apiSettings=ce(e),this.model=b.normalizeModelName(t,this._apiSettings.backend.backendType)}static normalizeModelName(e,t){return t===S.GOOGLE_AI?b.normalizeGoogleAIModelName(e):b.normalizeVertexAIModelName(e)}static normalizeGoogleAIModelName(e){return`models/${e}`}static normalizeVertexAIModelName(e){let t;return e.includes("/")?e.startsWith("models/")?t=`publishers/google/${e}`:t=e:t=`publishers/google/models/${e}`,t}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */const Be="Timeout has expired.",G="AbortError";class Ye{constructor(e){this.params=e}toString(){const e=new URL(this.baseUrl);return e.pathname=this.pathname,e.search=this.queryParams.toString(),e.toString()}get pathname(){return this.params.templateId?`${this.params.apiSettings.backend._getTemplatePath(this.params.apiSettings.project,this.params.templateId)}:${this.params.task}`:`${this.params.apiSettings.backend._getModelPath(this.params.apiSettings.project,this.params.model)}:${this.params.task}`}get baseUrl(){var e;return((e=this.params.singleRequestOptions)==null?void 0:e.baseUrl)??`https://${ie}`}get queryParams(){const e=new URLSearchParams;return this.params.stream&&e.set("alt","sse"),e}}class je{constructor(e){this.apiSettings=e}toString(){const e=new URL(`wss://${ie}`);e.pathname=this.pathname;const t=new URLSearchParams;return t.set("key",this.apiSettings.apiKey),e.search=t.toString(),e.toString()}get pathname(){return this.apiSettings.backend.backendType===S.GOOGLE_AI?"ws/google.firebase.vertexai.v1beta.GenerativeService/BidiGenerateContent":`ws/google.firebase.vertexai.v1beta.LlmBidiService/BidiGenerateContent/locations/${this.apiSettings.location}`}}function We(n){const e=[];return e.push(`${ve}/${Q}`),e.push(`fire/${Q}`),(n.params.apiSettings.inferenceMode===_.PREFER_ON_DEVICE||n.params.apiSettings.inferenceMode===_.PREFER_IN_CLOUD)&&e.push(ke),e.join(" ")}async function qe(n){const e=new Headers;if(e.append("Content-Type","application/json"),e.append("x-goog-api-client",We(n)),e.append("x-goog-api-key",n.params.apiSettings.apiKey),n.params.apiSettings.automaticDataCollectionEnabled&&e.append("X-Firebase-Appid",n.params.apiSettings.appId),n.params.apiSettings.getAppCheckToken){const t=await n.params.apiSettings.getAppCheckToken();t&&(e.append("X-Firebase-AppCheck",t.token),t.error&&h.warn(`Unable to obtain a valid App Check token: ${t.error.message}`))}if(n.params.apiSettings.getAuthToken){const t=await n.params.apiSettings.getAuthToken();t&&e.append("Authorization",`Firebase ${t.accessToken}`)}return e}async function D(n,e){var d,f;const t=new Ye(n);let s;const o=(d=n.singleRequestOptions)==null?void 0:d.signal,i=((f=n.singleRequestOptions)==null?void 0:f.timeout)!=null&&n.singleRequestOptions.timeout>=0?n.singleRequestOptions.timeout:Ue,a=new AbortController,r=setTimeout(()=>{a.abort(new DOMException(Be,G)),h.debug(`Aborting request to ${t} due to timeout (${i}ms)`)},i),u=AbortSignal.any(o?[o,a.signal]:[a.signal]);if(o&&o.aborted)throw clearTimeout(r),new DOMException(o.reason??"Aborted externally before fetch",G);try{const p={method:"POST",headers:await qe(t),signal:u,body:e};if(s=await fetch(t.toString(),p),!s.ok){let R="",E;try{const m=await s.json();R=m.error.message,m.error.details&&(R+=` ${JSON.stringify(m.error.details)}`,E=m.error.details)}catch{}throw s.status===403&&E&&E.some(m=>m.reason==="SERVICE_DISABLED")&&E.some(m=>{var W,q;return(q=(W=m.links)==null?void 0:W[0])==null?void 0:q.description.includes("Google developers console API activation")})?new c(l.API_NOT_ENABLED,`The Firebase AI SDK requires the Firebase AI API ('firebasevertexai.googleapis.com') to be enabled in your Firebase project. Enable this API by visiting the Firebase Console at https://console.firebase.google.com/project/${t.params.apiSettings.project}/ailogic/ and clicking "Get started". If you enabled this API recently, wait a few minutes for the action to propagate to our systems and then retry.`,{status:s.status,statusText:s.statusText,errorDetails:E}):new c(l.FETCH_ERROR,`Error fetching from ${t}: [${s.status} ${s.statusText}] ${R}`,{status:s.status,statusText:s.statusText,errorDetails:E})}}catch(p){let R=p;throw p.code!==l.FETCH_ERROR&&p.code!==l.API_NOT_ENABLED&&p instanceof Error&&p.name!==G&&(R=new c(l.ERROR,`Error fetching from ${t.toString()}: ${p.message}`),R.stack=p.stack),R}finally{clearTimeout(r)}return s}/**
 * @license
 * Copyright 2024 Google LLC
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
 */function v(n){if(n.candidates&&n.candidates.length>0){if(n.candidates.length>1&&h.warn(`This response had ${n.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),ue(n.candidates[0]))throw new c(l.RESPONSE_ERROR,`Response error: ${I(n)}. Response body stored in error.response`,{response:n});return!0}else return!1}function M(n,e=A.IN_CLOUD){n.candidates&&!n.candidates[0].hasOwnProperty("index")&&(n.candidates[0].index=0);const t=Je(n);return t.inferenceSource=e,t}function Je(n){return n.text=()=>{if(v(n))return z(n,e=>!e.thought);if(n.promptFeedback)throw new c(l.RESPONSE_ERROR,`Text not available. ${I(n)}`,{response:n});return""},n.thoughtSummary=()=>{if(v(n)){const e=z(n,t=>!!t.thought);return e===""?void 0:e}else if(n.promptFeedback)throw new c(l.RESPONSE_ERROR,`Thought summary not available. ${I(n)}`,{response:n})},n.inlineDataParts=()=>{if(v(n))return Ke(n);if(n.promptFeedback)throw new c(l.RESPONSE_ERROR,`Data not available. ${I(n)}`,{response:n})},n.functionCalls=()=>{if(v(n))return le(n);if(n.promptFeedback)throw new c(l.RESPONSE_ERROR,`Function call not available. ${I(n)}`,{response:n})},n}function z(n,e){var s,o,i,a;const t=[];if((o=(s=n.candidates)==null?void 0:s[0].content)!=null&&o.parts)for(const r of(a=(i=n.candidates)==null?void 0:i[0].content)==null?void 0:a.parts)r.text&&e(r)&&t.push(r.text);return t.length>0?t.join(""):""}function le(n){var t,s,o,i;if(!n)return;const e=[];if((s=(t=n.candidates)==null?void 0:t[0].content)!=null&&s.parts)for(const a of(i=(o=n.candidates)==null?void 0:o[0].content)==null?void 0:i.parts)a.functionCall&&e.push(a.functionCall);if(e.length>0)return e}function Ke(n){var t,s,o,i;const e=[];if((s=(t=n.candidates)==null?void 0:t[0].content)!=null&&s.parts)for(const a of(i=(o=n.candidates)==null?void 0:o[0].content)==null?void 0:i.parts)a.inlineData&&e.push(a);if(e.length>0)return e}const Qe=[g.RECITATION,g.SAFETY,g.BLOCKLIST,g.PROHIBITED_CONTENT,g.SPII,g.MALFORMED_FUNCTION_CALL,g.IMAGE_SAFETY,g.IMAGE_PROHIBITED_CONTENT,g.IMAGE_OTHER,g.NO_IMAGE,g.IMAGE_RECITATION,g.LANGUAGE,g.UNEXPECTED_TOOL_CALL,g.TOO_MANY_TOOL_CALLS,g.MISSING_THOUGHT_SIGNATURE,g.MALFORMED_RESPONSE];function ue(n){return!!n.finishReason&&Qe.some(e=>e===n.finishReason)}function I(n){var t,s,o;let e="";if((!n.candidates||n.candidates.length===0)&&n.promptFeedback)e+="Response was blocked",(t=n.promptFeedback)!=null&&t.blockReason&&(e+=` due to ${n.promptFeedback.blockReason}`),(s=n.promptFeedback)!=null&&s.blockReasonMessage&&(e+=`: ${n.promptFeedback.blockReasonMessage}`);else if((o=n.candidates)!=null&&o[0]){const i=n.candidates[0];ue(i)&&(e+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(e+=`: ${i.finishMessage}`))}return e}/**
 * @license
 * Copyright 2025 Google LLC
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
 */function de(n){var e,t;if((e=n.safetySettings)==null||e.forEach(s=>{if(s.method)throw new c(l.UNSUPPORTED,"SafetySetting.method is not supported in the the Gemini Developer API. Please remove this property.")}),(t=n.generationConfig)!=null&&t.topK){const s=Math.round(n.generationConfig.topK);s!==n.generationConfig.topK&&(h.warn("topK in GenerationConfig has been rounded to the nearest integer to match the format for requests to the Gemini Developer API."),n.generationConfig.topK=s)}return n}function j(n){return{candidates:n.candidates?ze(n.candidates):void 0,prompt:n.promptFeedback?Ze(n.promptFeedback):void 0,usageMetadata:n.usageMetadata}}function Xe(n,e){return{generateContentRequest:{model:e,...n}}}function ze(n){const e=[];let t;return e&&n.forEach(s=>{var a,r;let o;if(s.citationMetadata&&(o={citations:s.citationMetadata.citationSources}),s.safetyRatings&&(t=s.safetyRatings.map(u=>({...u,severity:u.severity??ae.HARM_SEVERITY_UNSUPPORTED,probabilityScore:u.probabilityScore??0,severityScore:u.severityScore??0}))),(r=(a=s.content)==null?void 0:a.parts)!=null&&r.some(u=>u==null?void 0:u.videoMetadata))throw new c(l.UNSUPPORTED,"Part.videoMetadata is not supported in the Gemini Developer API. Please remove this property.");const i={index:s.index,content:s.content,finishReason:s.finishReason,finishMessage:s.finishMessage,safetyRatings:t,citationMetadata:o,groundingMetadata:s.groundingMetadata,urlContextMetadata:s.urlContextMetadata};e.push(i)}),e}function Ze(n){const e=[];return n.safetyRatings.forEach(s=>{e.push({category:s.category,probability:s.probability,severity:s.severity??ae.HARM_SEVERITY_UNSUPPORTED,probabilityScore:s.probabilityScore??0,severityScore:s.severityScore??0,blocked:s.blocked})}),{blockReason:n.blockReason,safetyRatings:e,blockReasonMessage:n.blockReasonMessage}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */const Z=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function pe(n,e,t){const s=n.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),o=st(s),[i,a]=o.tee(),{response:r,firstValue:u}=await et(a,e,t);return{stream:nt(i,e,t),response:r,firstValue:u}}async function et(n,e,t){const[s,o]=n.tee(),i=s.getReader(),{value:a}=await i.read();return{firstValue:a,response:tt(o,e,t)}}async function tt(n,e,t){const s=[],o=n.getReader();for(;;){const{done:i,value:a}=await o.read();if(i){let r=ot(s);return e.backend.backendType===S.GOOGLE_AI&&(r=j(r)),M(r,t)}s.push(a)}}async function*nt(n,e,t){var o,i;const s=n.getReader();for(;;){const{value:a,done:r}=await s.read();if(r)break;let u;e.backend.backendType===S.GOOGLE_AI?u=M(j(a),t):u=M(a,t);const d=(o=u.candidates)==null?void 0:o[0];!((i=d==null?void 0:d.content)!=null&&i.parts)&&!(d!=null&&d.finishReason)&&!(d!=null&&d.citationMetadata)&&!(d!=null&&d.urlContextMetadata)||(yield u)}}function st(n){const e=n.getReader();return new ReadableStream({start(s){let o="";return i();function i(){return e.read().then(({value:a,done:r})=>{if(r){if(o.trim()){s.error(new c(l.PARSE_FAILED,"Failed to parse stream"));return}s.close();return}o+=a;let u=o.match(Z),d;for(;u;){try{d=JSON.parse(u[1])}catch{s.error(new c(l.PARSE_FAILED,`Error parsing JSON response: "${u[1]}`));return}s.enqueue(d),o=o.substring(u[0].length),u=o.match(Z)}return i()})}}})}function ot(n){const e=n[n.length-1],t={promptFeedback:e==null?void 0:e.promptFeedback};for(const s of n)if(s.candidates)for(const o of s.candidates){const i=o.index||0;t.candidates||(t.candidates=[]),t.candidates[i]||(t.candidates[i]={index:o.index}),t.candidates[i].citationMetadata=o.citationMetadata,t.candidates[i].finishReason=o.finishReason,t.candidates[i].finishMessage=o.finishMessage,t.candidates[i].safetyRatings=o.safetyRatings,t.candidates[i].groundingMetadata=o.groundingMetadata;const a=o.urlContextMetadata;if(typeof a=="object"&&a!==null&&Object.keys(a).length>0&&(t.candidates[i].urlContextMetadata=a),o.content){if(!o.content.parts)continue;t.candidates[i].content||(t.candidates[i].content={role:o.content.role||"user",parts:[]});for(const r of o.content.parts){const u={...r};r.text!==""&&Object.keys(u).length>0&&t.candidates[i].content.parts.push(u)}}}return t}/**
 * @license
 * Copyright 2025 Google LLC
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
 */const it=[l.FETCH_ERROR,l.ERROR,l.API_NOT_ENABLED];async function he(n,e,t,s){if(!e)return{response:await s(),inferenceSource:A.IN_CLOUD};switch(e.mode){case _.ONLY_ON_DEVICE:if(await e.isAvailable(n))return{response:await t(),inferenceSource:A.ON_DEVICE};throw new c(l.UNSUPPORTED,"Inference mode is ONLY_ON_DEVICE, but an on-device model is not available.");case _.ONLY_IN_CLOUD:return{response:await s(),inferenceSource:A.IN_CLOUD};case _.PREFER_IN_CLOUD:try{return{response:await s(),inferenceSource:A.IN_CLOUD}}catch(o){if(o instanceof c&&it.includes(o.code)&&await e.isAvailable(n))return{response:await t(),inferenceSource:A.ON_DEVICE};throw o}case _.PREFER_ON_DEVICE:return await e.isAvailable(n)?{response:await t(),inferenceSource:A.ON_DEVICE}:{response:await s(),inferenceSource:A.IN_CLOUD};default:throw new c(l.ERROR,`Unexpected infererence mode: ${e.mode}`)}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */async function at(n,e,t,s){return n.backend.backendType===S.GOOGLE_AI&&(t=de(t)),D({task:"streamGenerateContent",model:e,apiSettings:n,stream:!0,singleRequestOptions:s},JSON.stringify(t))}async function fe(n,e,t,s,o){const i=await he(t,s,()=>s.generateContentStream(t),()=>at(n,e,t,o));return pe(i.response,n,i.inferenceSource)}async function rt(n,e,t,s){return n.backend.backendType===S.GOOGLE_AI&&(t=de(t)),D({model:e,task:"generateContent",apiSettings:n,stream:!1,singleRequestOptions:s},JSON.stringify(t))}async function Ee(n,e,t,s){const o=await D({task:"templateGenerateContent",templateId:e,apiSettings:n,stream:!1,singleRequestOptions:s},JSON.stringify(t)),i=await Re(o,n);return{response:M(i)}}async function me(n,e,t,s){const o=await D({task:"templateStreamGenerateContent",templateId:e,apiSettings:n,stream:!0,singleRequestOptions:s},JSON.stringify(t));return pe(o,n)}async function ge(n,e,t,s,o){const i=await he(t,s,()=>s.generateContent(t),()=>rt(n,e,t,o)),a=await Re(i.response,n);return{response:M(a,i.inferenceSource)}}async function Re(n,e){const t=await n.json();return e.backend.backendType===S.GOOGLE_AI?j(t):t}/**
 * @license
 * Copyright 2024 Google LLC
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
 */function k(n){if(n!=null){if(typeof n=="string")return{role:"system",parts:[{text:n}]};if(n.text)return{role:"system",parts:[n]};if(n.parts)return n.role?n:{role:"system",parts:n.parts}}}function L(n){let e=[];if(typeof n=="string")e=[{text:n}];else for(const t of n)typeof t=="string"?e.push({text:t}):e.push(t);return ct(e)}function ct(n){const e={role:"user",parts:[]};let t=!1,s=!1;for(const o of n)"functionResponse"in o?s=!0:t=!0,e.parts.push(o);if(t&&s)throw new c(l.INVALID_CONTENT,"Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!t&&!s)throw new c(l.INVALID_CONTENT,"No Content is provided for sending chat message.");return e}function F(n){let e;return n.contents?e=n:e={contents:[L(n)]},n.systemInstruction&&(e.systemInstruction=k(n.systemInstruction)),e}/**
 * @license
 * Copyright 2026 Google LLC
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
 */const ee="SILENT_ERROR",te=10;class Se{constructor(e,t,s){this.params=t,this.requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=e}async getHistory(){return await this._sendPromise,this._history}async _sendMessage(e,t){let s={};await this._sendPromise;const o=[];return this._sendPromise=this._sendPromise.then(async()=>{var u,d,f;let i,a=0;const r=((u=this.requestOptions)==null?void 0:u.maxSequentialFunctionCalls)??te;do{let p;if(i){a++;const m=await this._callFunctionsAsNeeded(i);p=L(m)}else p=L(e);const R=this._formatRequest(p,[...o]);o.push(p);const E=await this._callGenerateContent(R,t);if(E)if(s=E,i=this._getCallableFunctionCalls(E.response),E.response.candidates&&E.response.candidates.length>0){const m={parts:((d=E.response.candidates)==null?void 0:d[0].content.parts)||[],role:((f=E.response.candidates)==null?void 0:f[0].content.role)||"model"};o.push(m)}else{const m=I(E.response);m&&h.warn(`sendMessage() was unsuccessful. ${m}. Inspect response object for details.`)}else i=void 0}while(i&&a<r);i&&a>=r&&h.warn(`Automatic function calling exceeded the limit of ${r} function calls. Returning last model response.`)}),await this._sendPromise,this._history=this._history.concat(o),s}async _sendMessageStream(e,t){await this._sendPromise;const s=[],i=(async()=>{var f;let a,r=0;const u=((f=this.requestOptions)==null?void 0:f.maxSequentialFunctionCalls)??te;let d;do{let p;if(a){r++;const E=await this._callFunctionsAsNeeded(a);p=L(E)}else p=L(e);const R=this._formatRequest(p,[...s]);if(s.push(p),d=await this._callGenerateContentStream(R,t),a=this._getCallableFunctionCalls(d.firstValue),a&&d.firstValue&&d.firstValue.candidates&&d.firstValue.candidates.length>0){const E={...d.firstValue.candidates[0].content};E.role||(E.role="model"),s.push(E)}}while(a&&r<u);return a&&r>=u&&h.warn(`Automatic function calling exceeded the limit of ${u} function calls. Returning last model response.`),{stream:d.stream,response:d.response}})();return this._sendPromise=this._sendPromise.then(async()=>i).catch(a=>{throw new Error(ee)}).then(a=>a.response).then(a=>{if(a.candidates&&a.candidates.length>0){this._history=this._history.concat(s);const r={...a.candidates[0].content};r.role||(r.role="model"),this._history.push(r)}else{const r=I(a);r&&h.warn(`sendMessageStream() was unsuccessful. ${r}. Inspect response object for details.`)}}).catch(a=>{a.message!==ee&&a.name!=="AbortError"&&h.error(a)}),i}_getCallableFunctionCalls(e){var o,i,a;const t=(i=(o=this.params)==null?void 0:o.tools)==null?void 0:i.find(r=>r.functionDeclarations);if(!(t!=null&&t.functionDeclarations))return;const s=le(e);if(s){for(const r of s)if(!((a=t.functionDeclarations)==null?void 0:a.some(d=>d.name===r.name&&typeof d.functionReference=="function")))return;return s}}async _callFunctionsAsNeeded(e){var i,a;const t=[],s=[],o=(a=(i=this.params)==null?void 0:i.tools)==null?void 0:a.find(r=>r.functionDeclarations);if(o&&o.functionDeclarations){for(const u of e){const d=o.functionDeclarations.find(f=>f.name===u.name);if(d!=null&&d.functionReference){const f=Promise.resolve(d.functionReference(u.args)).catch(p=>{const R=new c(l.ERROR,`Error in user-defined function "${d.name}": ${p.message}`);throw R.stack=p.stack,R});t.push({name:u.name,id:u.id,results:f}),s.push(f)}}await Promise.all(s);const r=[];for(const{name:u,id:d,results:f}of t){const p={name:u,response:await f};d&&(p.id=d),r.push({functionResponse:p})}return r}else throw new c(l.REQUEST_ERROR,'No function declarations were provided in "tools".')}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */const ne=["text","inlineData","functionCall","functionResponse","thought","thoughtSignature"],lt={user:["text","inlineData","functionResponse"],function:["functionResponse"],model:["text","functionCall","thought","thoughtSignature"],system:["text"]},se={user:["model"],function:["model"],model:["user","function"],system:[]};function Oe(n){let e=null;for(const t of n){const{role:s,parts:o}=t;if(!e&&s!=="user")throw new c(l.INVALID_CONTENT,`First Content should be with role 'user', got ${s}`);if(!X.includes(s))throw new c(l.INVALID_CONTENT,`Each item should include role field. Got ${s} but valid roles are: ${JSON.stringify(X)}`);if(!Array.isArray(o))throw new c(l.INVALID_CONTENT,"Content should have 'parts' property with an array of Parts");if(o.length===0)throw new c(l.INVALID_CONTENT,"Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0,thought:0,thoughtSignature:0,executableCode:0,codeExecutionResult:0};for(const r of o)for(const u of ne)u in r&&(i[u]+=1);const a=lt[s];for(const r of ne)if(!a.includes(r)&&i[r]>0)throw new c(l.INVALID_CONTENT,`Content with role '${s}' can't contain '${r}' part`);if(e&&!se[s].includes(e.role))throw new c(l.INVALID_CONTENT,`Content with role '${s}' can't follow '${e.role}'. Valid previous roles: ${JSON.stringify(se)}`);e=t}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */class ut extends Se{constructor(e,t,s,o,i){var a;super(e,o,i),this.model=t,this.chromeAdapter=s,this.params=o,this.requestOptions=i,o!=null&&o.history&&(Oe(o.history),this._history=o.history),((a=this.params)==null?void 0:a.systemInstruction)!=null&&(this.params={...this.params,systemInstruction:k(this.params.systemInstruction)})}_formatRequest(e,t){var s,o,i,a,r;return{safetySettings:(s=this.params)==null?void 0:s.safetySettings,generationConfig:(o=this.params)==null?void 0:o.generationConfig,tools:(i=this.params)==null?void 0:i.tools,toolConfig:(a=this.params)==null?void 0:a.toolConfig,systemInstruction:(r=this.params)==null?void 0:r.systemInstruction,contents:[...this._history,...t,e]}}_callGenerateContent(e,t){return ge(this._apiSettings,this.model,e,this.chromeAdapter,{...this.requestOptions,...t})}_callGenerateContentStream(e,t){return fe(this._apiSettings,this.model,e,this.chromeAdapter,{...this.requestOptions,...t})}async sendMessage(e,t){return this._sendMessage(e,t)}async sendMessageStream(e,t){return this._sendMessageStream(e,t)}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */async function dt(n,e,t,s){let o="";if(n.backend.backendType===S.GOOGLE_AI){const a=Xe(t,e);o=JSON.stringify(a)}else o=JSON.stringify(t);return(await D({model:e,task:"countTokens",apiSettings:n,stream:!1,singleRequestOptions:s},o)).json()}async function pt(n,e,t,s,o){if((s==null?void 0:s.mode)===_.ONLY_ON_DEVICE)throw new c(l.UNSUPPORTED,"countTokens() is not supported for on-device models.");return dt(n,e,t,o)}/**
 * @license
 * Copyright 2024 Google LLC
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
 */class ht extends b{constructor(e,t,s,o){super(e,t.model),this.chromeAdapter=o,this.generationConfig=t.generationConfig||{},ft(this.generationConfig),this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=k(t.systemInstruction),this.requestOptions=s||{}}async initializeDeviceModel(e){if(!this.chromeAdapter||this.chromeAdapter.mode===_.ONLY_IN_CLOUD)return;if(await this.chromeAdapter.downloadIfAvailable(e)===T.UNAVAILABLE){const s=new c(l.API_NOT_ENABLED,"Local LanguageModel API not available in this environment.");if(this.chromeAdapter.mode===_.ONLY_ON_DEVICE)throw s;h.debug(s.message)}await this.chromeAdapter.downloadPromise}async generateContent(e,t){const s=F(e);return ge(this._apiSettings,this.model,{generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,...s},this.chromeAdapter,{...this.requestOptions,...t})}async generateContentStream(e,t){const s=F(e),{stream:o,response:i}=await fe(this._apiSettings,this.model,{generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,...s},this.chromeAdapter,{...this.requestOptions,...t});return{stream:o,response:i}}startChat(e){return new ut(this._apiSettings,this.model,this.chromeAdapter,{tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,generationConfig:this.generationConfig,safetySettings:this.safetySettings,...e},this.requestOptions)}async countTokens(e,t){const s=F(e);return pt(this._apiSettings,this.model,s,this.chromeAdapter,{...this.requestOptions,...t})}}function ft(n){var e,t;if(((e=n.thinkingConfig)==null?void 0:e.thinkingBudget)!=null&&((t=n.thinkingConfig)!=null&&t.thinkingLevel))throw new c(l.UNSUPPORTED,"Cannot set both thinkingBudget and thinkingLevel in a config.");if(n.responseSchema!=null&&n.responseJsonSchema!=null)throw new c(l.UNSUPPORTED,"Cannot set both responseSchema and responseJsonSchema in a config.");if((n.responseSchema!=null||n.responseJsonSchema!=null)&&n.responseMimeType!=="application/json"&&n.responseMimeType!=="text/x.enum")throw new c(l.UNSUPPORTED,'responseMimeType must be set to "application/json" or "text/x.enum" if responseSchema or responseJsonSchema are set.')}/**
 * @license
 * Copyright 2025 Google LLC
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
 */class Et{constructor(){if(typeof WebSocket>"u")throw new c(l.UNSUPPORTED,'The WebSocket API is not available in this environment. The "Live" feature is not supported here. It is supported in modern browser windows, Web Workers with WebSocket support, and Node >= 22.')}connect(e){return new Promise((t,s)=>{this.ws=new WebSocket(e),this.ws.binaryType="blob",this.ws.addEventListener("open",()=>t(),{once:!0}),this.ws.addEventListener("error",()=>s(new c(l.FETCH_ERROR,"Error event raised on WebSocket")),{once:!0}),this.ws.addEventListener("close",o=>{o.reason&&h.warn(`WebSocket connection closed by server. Reason: '${o.reason}'`)})})}send(e){if(!this.ws||this.ws.readyState!==WebSocket.OPEN)throw new c(l.REQUEST_ERROR,"WebSocket is not open.");this.ws.send(e)}async*listen(){if(!this.ws)throw new c(l.REQUEST_ERROR,"WebSocket is not connected.");const e=[],t=[];let s=null,o=!1;const i=async u=>{let d;if(u.data instanceof Blob)d=await u.data.text();else if(typeof u.data=="string")d=u.data;else{t.push(new c(l.PARSE_FAILED,`Failed to parse WebSocket response. Expected data to be a Blob or string, but was ${typeof u.data}.`)),s&&(s(),s=null);return}try{const f=JSON.parse(d);e.push(f)}catch(f){const p=f;t.push(new c(l.PARSE_FAILED,`Error parsing WebSocket message to JSON: ${p.message}`))}s&&(s(),s=null)},a=()=>{t.push(new c(l.FETCH_ERROR,"WebSocket connection error.")),s&&(s(),s=null)},r=u=>{var d,f,p;u.reason&&h.warn(`WebSocket connection closed by the server with reason: ${u.reason}`),o=!0,s&&(s(),s=null),(d=this.ws)==null||d.removeEventListener("message",i),(f=this.ws)==null||f.removeEventListener("close",r),(p=this.ws)==null||p.removeEventListener("error",a)};for(this.ws.addEventListener("message",i),this.ws.addEventListener("close",r),this.ws.addEventListener("error",a);!o;){if(t.length>0)throw t.shift();e.length>0?yield e.shift():await new Promise(u=>{s=u})}if(t.length>0)throw t.shift()}close(e,t){return new Promise(s=>{if(!this.ws||(this.ws.addEventListener("close",()=>s(),{once:!0}),this.ws.readyState===WebSocket.CLOSED||this.ws.readyState===WebSocket.CONNECTING))return s();this.ws.readyState!==WebSocket.CLOSING&&this.ws.close(e,t)})}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */class mt{constructor(e,t,s,o){this._setupMessage=e,this._apiSettings=t,this._sessionResumption=s,this.isClosed=!1,this.inConversation=!1,this._serverMessages=null,this._webSocketHandler=o||new Et,this.connectionPromise=this._connectSession(this._sessionResumption)}async _connectSession(e){const t=new je(this._apiSettings);await this._webSocketHandler.connect(t.toString());try{this._serverMessages=this._webSocketHandler.listen();const s={...this._setupMessage};e&&(s.setup.sessionResumption=e),this._webSocketHandler.send(JSON.stringify(s));const o=(await this._serverMessages.next()).value;if(!o||typeof o!="object"||!("setupComplete"in o))throw await this._webSocketHandler.close(1011,"Handshake failure"),new c(l.RESPONSE_ERROR,"Server connection handshake failed. The server did not respond with a setupComplete message.");this.isClosed=!1}catch(s){throw await this._webSocketHandler.close(),s}}async resumeSession(e){if(!this._sessionResumption)throw new c(l.UNSUPPORTED,"Cannot resume session: no sessionResumption config provided");await this.close(),await this._connectSession(e)}async send(e,t=!0){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const o={clientContent:{turns:[L(e)],turnComplete:t}};this._webSocketHandler.send(JSON.stringify(o))}async sendTextRealtime(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const t={realtimeInput:{text:e}};this._webSocketHandler.send(JSON.stringify(t))}async sendAudioRealtime(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const t={realtimeInput:{audio:e}};this._webSocketHandler.send(JSON.stringify(t))}async sendVideoRealtime(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const t={realtimeInput:{video:e}};this._webSocketHandler.send(JSON.stringify(t))}async sendFunctionResponses(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const t={toolResponse:{functionResponses:e}};this._webSocketHandler.send(JSON.stringify(t))}async*receive(){if(this.isClosed)throw new c(l.SESSION_CLOSED,"Cannot read from a Live session that is closed. Try starting a new Live session.");if(this._serverMessages)for await(const e of this._serverMessages)if(e&&typeof e=="object")if(N.SERVER_CONTENT in e)yield{type:"serverContent",...e.serverContent};else if(N.TOOL_CALL in e)yield{type:"toolCall",...e.toolCall};else if(N.TOOL_CALL_CANCELLATION in e)yield{type:"toolCallCancellation",...e.toolCallCancellation};else if("goAway"in e){const t=e.goAway;yield{type:N.GOING_AWAY_NOTICE,timeLeft:gt(t.timeLeft)}}else N.SESSION_RESUMPTION_UPDATE in e?yield{type:N.SESSION_RESUMPTION_UPDATE,...e.sessionResumptionUpdate}:h.warn(`Received an unknown message type from the server: ${JSON.stringify(e)}`);else h.warn(`Received an invalid message from the server: ${JSON.stringify(e)}`)}async close(){this.isClosed||(this.isClosed=!0,await this._webSocketHandler.close(1e3,"Client closed session."))}async sendMediaChunks(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");e.forEach(t=>{const s={realtimeInput:{mediaChunks:[t]}};this._webSocketHandler.send(JSON.stringify(s))})}async sendMediaStream(e){if(this.isClosed)throw new c(l.REQUEST_ERROR,"This LiveSession has been closed and cannot be used.");const t=e.getReader();for(;;)try{const{done:s,value:o}=await t.read();if(s)break;if(!o)throw new Error("Missing chunk in reader, but reader is not done.");await this.sendMediaChunks([o])}catch(s){const o=s instanceof Error?s.message:"Error processing media stream.";throw new c(l.REQUEST_ERROR,o)}}}function gt(n){return!n||!n.endsWith("s")?0:Number(n.slice(0,-1))}/**
 * @license
 * Copyright 2025 Google LLC
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
 */class Rt extends b{constructor(e,t,s){super(e,t.model),this._webSocketHandler=s,this.generationConfig=t.generationConfig||{},this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=k(t.systemInstruction)}async connect(e){let t;this._apiSettings.backend.backendType===S.GOOGLE_AI?t=`projects/${this._apiSettings.project}/${this.model}`:t=`projects/${this._apiSettings.project}/locations/${this._apiSettings.location}/${this.model}`;const{inputAudioTranscription:s,outputAudioTranscription:o,...i}=this.generationConfig,a=i.contextWindowCompression;delete i.contextWindowCompression;const r={setup:{model:t,generationConfig:i,contextWindowCompression:a,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,inputAudioTranscription:s,outputAudioTranscription:o,sessionResumption:e}},u=new mt(r,this._apiSettings,e,this._webSocketHandler);return await u.connectionPromise,u}}/**
 * @license
 * Copyright 2026 Google LLC
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
 */class St extends Se{constructor(e,t,s){super(e,t,s),this.params=t,this.requestOptions=s,t.history&&(Oe(t.history),this._history=t.history)}_formatRequest(e,t){var o;const s={history:[...this._history,...t,e]};return this.params.templateVariables&&(s.inputs=this.params.templateVariables),this.params.tools&&(s.tools=(o=this.params.tools)==null?void 0:o.map(i=>i.functionDeclarations?{templateFunctions:i.functionDeclarations.map(a=>{if(a.parameters){const r={...a};return delete r.parameters,r.inputSchema=a.parameters,r}return a})}:i)),this.params.toolConfig&&(s.toolConfig=this.params.toolConfig),s}_callGenerateContent(e,t){return Ee(this._apiSettings,this.params.templateId,e,{...this.requestOptions,...t})}_callGenerateContentStream(e,t){return me(this._apiSettings,this.params.templateId,e,{...this.requestOptions,...t})}async sendMessage(e,t){return this._sendMessage(e,t)}async sendMessageStream(e,t){return this._sendMessageStream(e,t)}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */class Ot{constructor(e,t){this.requestOptions=t||{},this._apiSettings=ce(e)}async generateContent(e,t,s,o){return Ee(this._apiSettings,e,{inputs:t,...o&&{toolConfig:o}},{...this.requestOptions,...s})}async generateContentStream(e,t,s,o){return me(this._apiSettings,e,{inputs:t,...o&&{toolConfig:o}},{...this.requestOptions,...s})}startChat(e){return new St(this._apiSettings,e,this.requestOptions)}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */class y{constructor(e){if(!e.type&&!e.anyOf)throw new c(l.INVALID_SCHEMA,"A schema must have either a 'type' or an 'anyOf' array of sub-schemas.");for(const t in e)this[t]=e[t];this.type=e.type,this.format=e.hasOwnProperty("format")?e.format:void 0,this.nullable=e.hasOwnProperty("nullable")?!!e.nullable:!1}toJSON(){const e={type:this.type};for(const t in this)this.hasOwnProperty(t)&&this[t]!==void 0&&(t!=="required"||this.type===C.OBJECT)&&(e[t]=this[t]);return e}static array(e){return new It(e,e.items)}static object(e){return new wt(e,e.properties,e.optionalProperties)}static string(e){return new oe(e)}static enumString(e){return new oe(e,e.enum)}static integer(e){return new _t(e)}static number(e){return new Tt(e)}static boolean(e){return new At(e)}static anyOf(e){return new Ct(e)}}class _t extends y{constructor(e){super({type:C.INTEGER,...e})}}class Tt extends y{constructor(e){super({type:C.NUMBER,...e})}}class At extends y{constructor(e){super({type:C.BOOLEAN,...e})}}class oe extends y{constructor(e,t){super({type:C.STRING,...e}),this.enum=t}toJSON(){const e=super.toJSON();return this.enum&&(e.enum=this.enum),e}}class It extends y{constructor(e,t){super({type:C.ARRAY,...e}),this.items=t}toJSON(){const e=super.toJSON();return e.items=this.items.toJSON(),e}}class wt extends y{constructor(e,t,s=[]){super({type:C.OBJECT,...e}),this.properties=t,this.optionalProperties=s}toJSON(){const e=super.toJSON();e.properties={...this.properties};const t=[];if(this.optionalProperties){for(const s of this.optionalProperties)if(!this.properties.hasOwnProperty(s))throw new c(l.INVALID_SCHEMA,`Property "${s}" specified in "optionalProperties" does not exist.`)}for(const s in this.properties)this.properties.hasOwnProperty(s)&&(e.properties[s]=this.properties[s].toJSON(),this.optionalProperties.includes(s)||t.push(s));return t.length>0&&(e.required=t),delete e.optionalProperties,e}}class Ct extends y{constructor(e){if(e.anyOf.length===0)throw new c(l.INVALID_SCHEMA,"The 'anyOf' array must not be empty.");super({...e,type:void 0}),this.anyOf=e.anyOf}toJSON(){const e=super.toJSON();return this.anyOf&&Array.isArray(this.anyOf)&&(e.anyOf=this.anyOf.map(t=>t.toJSON())),e}}/**
 * @license
 * Copyright 2025 Google LLC
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
 */const yt=16e3,Nt=24e3,_e="audio-processor",Lt=`
  class AudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
      super();
      this.targetSampleRate = options.processorOptions.targetSampleRate;
      // 'sampleRate' is a global variable available inside the AudioWorkletGlobalScope,
      // representing the native sample rate of the AudioContext.
      this.inputSampleRate = sampleRate;
    }

    /**
     * This method is called by the browser's audio engine for each block of audio data.
     * Input is a single input, with a single channel (input[0][0]).
     */
    process(inputs) {
      const input = inputs[0];
      if (input && input.length > 0 && input[0].length > 0) {
        const pcmData = input[0]; // Float32Array of raw audio samples.
        
        // Simple linear interpolation for resampling.
        const resampled = new Float32Array(Math.round(pcmData.length * this.targetSampleRate / this.inputSampleRate));
        const ratio = pcmData.length / resampled.length;
        for (let i = 0; i < resampled.length; i++) {
          resampled[i] = pcmData[Math.floor(i * ratio)];
        }

        // Convert Float32 (-1, 1) samples to Int16 (-32768, 32767)
        const resampledInt16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const sample = Math.max(-1, Math.min(1, resampled[i]));
          if (sample < 0) {
            resampledInt16[i] = sample * 32768;
          } else {
            resampledInt16[i] = sample * 32767;
          }
        }
        
        this.port.postMessage(resampledInt16);
      }
      // Return true to keep the processor alive and processing the next audio block.
      return true;
    }
  }

  // Register the processor with a name that can be used to instantiate it from the main thread.
  registerProcessor('${_e}', AudioProcessor);
`;class bt{constructor(e,t,s){this.liveSession=e,this.options=t,this.deps=s,this.isStopped=!1,this.stopDeferred=new Ne,this.playbackQueue=[],this.scheduledSources=[],this.nextStartTime=0,this.isPlaybackLoopRunning=!1,this.liveSession.inConversation=!0,this.receiveLoopPromise=this.runReceiveLoop().finally(()=>this.cleanup()),this.deps.workletNode.port.onmessage=o=>{if(this.isStopped)return;const i=o.data,r={mimeType:"audio/pcm",data:btoa(String.fromCharCode.apply(null,Array.from(new Uint8Array(i.buffer))))};this.liveSession.sendAudioRealtime(r)}}async stop(){this.isStopped||(this.isStopped=!0,this.stopDeferred.resolve(),await this.receiveLoopPromise)}cleanup(){this.interruptPlayback(),this.deps.workletNode.port.onmessage=null,this.deps.workletNode.disconnect(),this.deps.sourceNode.disconnect(),this.deps.mediaStream.getTracks().forEach(e=>e.stop()),this.deps.audioContext.state!=="closed"&&this.deps.audioContext.close(),this.liveSession.inConversation=!1}enqueueAndPlay(e){this.playbackQueue.push(e),this.processPlaybackQueue()}interruptPlayback(){[...this.scheduledSources].forEach(e=>e.stop(0)),this.playbackQueue.length=0,this.nextStartTime=this.deps.audioContext.currentTime}async processPlaybackQueue(){if(!this.isPlaybackLoopRunning){for(this.isPlaybackLoopRunning=!0;this.playbackQueue.length>0&&!this.isStopped;){const e=this.playbackQueue.shift();try{const t=new Int16Array(e),s=t.length,o=this.deps.audioContext.createBuffer(1,s,Nt),i=o.getChannelData(0);for(let r=0;r<s;r++)i[r]=t[r]/32768;const a=this.deps.audioContext.createBufferSource();a.buffer=o,a.connect(this.deps.audioContext.destination),this.scheduledSources.push(a),a.onended=()=>{this.scheduledSources=this.scheduledSources.filter(r=>r!==a)},this.nextStartTime=Math.max(this.deps.audioContext.currentTime,this.nextStartTime),a.start(this.nextStartTime),this.nextStartTime+=o.duration}catch(t){h.error("Error playing audio:",t)}}this.isPlaybackLoopRunning=!1}}async runReceiveLoop(){var t;const e=this.liveSession.receive();for(;!this.isStopped;){const s=await Promise.race([e.next(),this.stopDeferred.promise]);if(this.isStopped||!s||s.done)break;const o=s.value;if(o.type==="serverContent"){const i=o;i.interrupted&&this.interruptPlayback();const a=(t=i.modelTurn)==null?void 0:t.parts.find(r=>{var u;return(u=r.inlineData)==null?void 0:u.mimeType.startsWith("audio/")});if(a!=null&&a.inlineData){const r=Uint8Array.from(atob(a.inlineData.data),u=>u.charCodeAt(0)).buffer;this.enqueueAndPlay(r)}}else if(o.type==="toolCall")if(!this.options.functionCallingHandler)h.warn("Received tool call message, but StartAudioConversationOptions.functionCallingHandler is undefined. Ignoring tool call.");else try{const i=await this.options.functionCallingHandler(o.functionCalls);this.isStopped||this.liveSession.sendFunctionResponses([i])}catch(i){throw new c(l.ERROR,`Function calling handler failed: ${i.message}`)}}}}async function Jt(n,e={}){if(n.isClosed)throw new c(l.SESSION_CLOSED,"Cannot start audio conversation on a closed LiveSession.");if(n.inConversation)throw new c(l.REQUEST_ERROR,"An audio conversation is already in progress for this session.");if(typeof AudioWorkletNode>"u"||typeof AudioContext>"u"||typeof navigator>"u"||!navigator.mediaDevices)throw new c(l.UNSUPPORTED,"Audio conversation is not supported in this environment. It requires the Web Audio API and AudioWorklet support.");let t;try{t=new AudioContext,t.state==="suspended"&&await t.resume();const s=await navigator.mediaDevices.getUserMedia({audio:!0}),o=new Blob([Lt],{type:"application/javascript"}),i=URL.createObjectURL(o);await t.audioWorklet.addModule(i);const a=t.createMediaStreamSource(s),r=new AudioWorkletNode(t,_e,{processorOptions:{targetSampleRate:yt}});a.connect(r);const u=new bt(n,e,{audioContext:t,mediaStream:s,sourceNode:a,workletNode:r});return{stop:()=>u.stop()}}catch(s){throw t&&t.state!=="closed"&&t.close(),s instanceof c||s instanceof DOMException?s:new c(l.ERROR,`Failed to initialize audio recording: ${s.message}`)}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */function Kt(n=Ce(),e){n=Ie(n);const t=we(n,w),s=(e==null?void 0:e.backend)??new V,o={useLimitedUseAppCheckTokens:(e==null?void 0:e.useLimitedUseAppCheckTokens)??!1},i=Ge(s),a=t.getImmediate({identifier:i});return a.options=o,a}const Pt=["mode","onDeviceParams","inCloudParams"];function Qt(n,e,t){var r;const s=e;let o;if(s.mode){for(const u of Object.keys(e))Pt.includes(u)||h.warn(`When a hybrid inference mode is specified (mode is currently set to ${s.mode}), "${u}" cannot be configured at the top level. Configuration for in-cloud and on-device must be done separately in inCloudParams and onDeviceParams. Configuration values set outside of inCloudParams and onDeviceParams will be ignored.`);o=s.inCloudParams||{model:xe}}else o=e;if(!o.model)throw new c(l.NO_MODEL,"Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");const i=(r=n.chromeAdapterFactory)==null?void 0:r.call(n,s.mode,typeof window>"u"?void 0:window,s.onDeviceParams),a=new ht(n,o,t,i);return a._apiSettings.inferenceMode=s.mode,a}function Xt(n,e){if(!e.model)throw new c(l.NO_MODEL,"Must provide a model name for getLiveGenerativeModel. Example: getLiveGenerativeModel(ai, { model: 'my-model-name' })");return new Rt(n,e)}function zt(n,e){return new Ot(n,e)}/**
 * @license
 * Copyright 2025 Google LLC
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
 */function Mt(){Le(new be(w,Ve,"PUBLIC").setMultipleInstances(!0)),J(K,H),J(K,H,"esm2020")}Mt();export{c as AIError,l as AIErrorCode,b as AIModel,Y as AgentPlatformBackend,Ct as AnyOfSchema,It as ArraySchema,$ as Backend,S as BackendType,Gt as BlockReason,At as BooleanSchema,ut as ChatSession,Se as ChatSessionBase,g as FinishReason,$t as FunctionCallingMode,ht as GenerativeModel,V as GoogleAIBackend,Ut as HarmBlockMethod,kt as HarmBlockThreshold,vt as HarmCategory,xt as HarmProbability,ae as HarmSeverity,Ft as ImageConfigAspectRatio,Ht as ImageConfigImageSize,_ as InferenceMode,A as InferenceSource,_t as IntegerSchema,jt as Language,Rt as LiveGenerativeModel,N as LiveResponseType,mt as LiveSession,Vt as Modality,Tt as NumberSchema,wt as ObjectSchema,Yt as Outcome,X as POSSIBLE_ROLES,Bt as ResponseModality,y as Schema,C as SchemaType,oe as StringSchema,Ot as TemplateGenerativeModel,Wt as ThinkingLevel,qt as URLRetrievalStatus,B as VertexAIBackend,Kt as getAI,Qt as getGenerativeModel,Xt as getLiveGenerativeModel,zt as getTemplateGenerativeModel,Jt as startAudioConversation};
