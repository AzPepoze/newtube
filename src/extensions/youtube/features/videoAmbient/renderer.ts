import { logger } from "@shared/logger";

const vsSource = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y;
}`;

const fsSource = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
const float BlurQua = 30.0;
uniform vec2 u_BlurAm;
uniform float u_Alpha;
uniform vec2 canvasRes;

vec4 applyBlur(sampler2D image, vec2 BlurDirection) {
    if (u_BlurAm == vec2(0,0)) return texture2D(image, v_texCoord);
    vec2 CalBlur = BlurDirection / canvasRes;
    vec4 color = vec4(0.0);
    float total = 0.0;
    for (float i = -BlurQua; i <= BlurQua; i++) {
        float percent = (i - 0.5) / BlurQua;
        float weight = 1.0 - abs(percent);
        vec4 sample = texture2D(image, v_texCoord + CalBlur * percent);
        sample.rgb *= sample.a;
        color += sample * weight;
        total += weight;
    }
    return color / total;
}

void main() {
    vec4 color = applyBlur(u_image, u_BlurAm);
    gl_FragColor = color * u_Alpha;
}`;

const POSITION_DATA = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]);

export interface RenderSettings {
	blur: number;
	quality: number;
	smooth: number;
	engine: "GPU" | "CPU";
}

export class VideoBGRenderer {
	private blurTexture: WebGLTexture | null = null;
	private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
	private ctx2d: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
	private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
	private preCanvas: OffscreenCanvas | null = null;
	private preCtx2d: OffscreenCanvasRenderingContext2D | null = null;
	private preGl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
	private preProgram: WebGLProgram | null = null;
	private program: WebGLProgram | null = null;
	private settings: RenderSettings = {
		blur: 30,
		quality: 0.5,
		smooth: 1,
		engine: "GPU",
	};
	private uniformLocations = {
		mainBlurAmountLocation: null as WebGLUniformLocation | null,
		mainAlphaLocation: null as WebGLUniformLocation | null,
		mainResolutionLocation: null as WebGLUniformLocation | null,
		preSmoothingAlphaLocation: null as WebGLUniformLocation | null,
		preBlurAmountLocation: null as WebGLUniformLocation | null,
	};
	private videoTexture: WebGLTexture | null = null;
	constructor() {}

	private initProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null {
		const vShader = this.loadShader(gl, gl.VERTEX_SHADER, vs);
		const fShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fs);
		if (!vShader || !fShader) return null;
		const prog = gl.createProgram();
		if (!prog) return null;
		gl.attachShader(prog, vShader);
		gl.attachShader(prog, fShader);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			logger.error("video-bg-renderer", "Program link error:", gl.getProgramInfoLog(prog));
			return null;
		}
		return prog;
	}

	private loadShader(
		gl: WebGLRenderingContext | WebGL2RenderingContext,
		type: number,
		source: string,
	): WebGLShader | null {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			logger.error("video-bg-renderer", "Shader compile error:", gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	public init(canvas: HTMLCanvasElement | OffscreenCanvas, settings: RenderSettings) {
		this.canvas = canvas;
		this.settings = settings;

		if (this.settings.engine === "GPU") {
			try {
				this.gl =
					(this.canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGL2RenderingContext) ||
					(this.canvas.getContext("webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext);
			} catch (e) {
				logger.warn("video-bg-renderer", "WebGL context creation failed on canvas:", e);
				this.gl = null;
			}

			if (this.gl) {
				const gl = this.gl;
				this.preCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
				this.preGl =
					(this.preCanvas.getContext("webgl2", {
						preserveDrawingBuffer: true,
					}) as WebGL2RenderingContext) ||
					(this.preCanvas.getContext("webgl", {
						preserveDrawingBuffer: true,
					}) as WebGLRenderingContext);
				const preGl = this.preGl;

				this.program = this.initProgram(gl, vsSource, fsSource);
				this.preProgram = this.initProgram(preGl, vsSource, fsSource);

				if (this.program && this.preProgram) {
					gl.useProgram(this.program);
					const positionAttr = gl.getAttribLocation(this.program, "a_position");
					this.uniformLocations.mainBlurAmountLocation = gl.getUniformLocation(this.program, "u_BlurAm");
					this.uniformLocations.mainAlphaLocation = gl.getUniformLocation(this.program, "u_Alpha");
					this.uniformLocations.mainResolutionLocation = gl.getUniformLocation(this.program, "canvasRes");
					const uImageMain = gl.getUniformLocation(this.program, "u_image");
					gl.uniform1i(uImageMain, 0);

					const positionBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, POSITION_DATA, gl.STATIC_DRAW);
					gl.enableVertexAttribArray(positionAttr);
					gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);
					this.blurTexture = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, this.blurTexture);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

					preGl.useProgram(this.preProgram);
					preGl.blendFunc(preGl.ONE, preGl.ONE_MINUS_SRC_ALPHA);
					preGl.enable(preGl.BLEND);
					const prePos = preGl.getAttribLocation(this.preProgram, "a_position");
					this.uniformLocations.preSmoothingAlphaLocation = preGl.getUniformLocation(this.preProgram, "u_Alpha");
					this.uniformLocations.preBlurAmountLocation = preGl.getUniformLocation(this.preProgram, "u_BlurAm");
					const preResolutionLocation = preGl.getUniformLocation(this.preProgram, "canvasRes");
					const uImagePre = preGl.getUniformLocation(this.preProgram, "u_image");
					preGl.uniform1i(uImagePre, 0);
					preGl.uniform2f(this.uniformLocations.preBlurAmountLocation, 0, 0);
					if (preResolutionLocation) preGl.uniform2f(preResolutionLocation, this.canvas.width, this.canvas.height);

					const pBuf = preGl.createBuffer();
					preGl.bindBuffer(preGl.ARRAY_BUFFER, pBuf);
					preGl.bufferData(preGl.ARRAY_BUFFER, POSITION_DATA, preGl.STATIC_DRAW);
					preGl.enableVertexAttribArray(prePos);
					preGl.vertexAttribPointer(prePos, 2, preGl.FLOAT, false, 0, 0);
					this.videoTexture = preGl.createTexture();
					preGl.bindTexture(preGl.TEXTURE_2D, this.videoTexture);
					preGl.texParameteri(preGl.TEXTURE_2D, preGl.TEXTURE_WRAP_S, preGl.CLAMP_TO_EDGE);
					preGl.texParameteri(preGl.TEXTURE_2D, preGl.TEXTURE_WRAP_T, preGl.CLAMP_TO_EDGE);
					preGl.texParameteri(preGl.TEXTURE_2D, preGl.TEXTURE_MIN_FILTER, preGl.LINEAR);
					logger.info("video-bg-renderer", "WebGL2 initialized successfully");
				} else {
					this.settings.engine = "CPU";
				}
			} else {
				this.settings.engine = "CPU";
			}
		}

		if (this.settings.engine === "CPU") {
			this.ctx2d = this.canvas.getContext("2d", { alpha: false }) as any;
			this.preCanvas = new OffscreenCanvas(this.canvas.width || 100, this.canvas.height || 100);
			this.preCtx2d = this.preCanvas.getContext("2d", { alpha: true }) as any;
			logger.info("video-bg-renderer", "CPU initialized successfully", {
				ctx2d: !!this.ctx2d,
				preCtx2d: !!this.preCtx2d,
				width: this.canvas.width,
				height: this.canvas.height,
			});
		}
	}

	public render(bitmap: ImageBitmap) {
		if (!this.canvas || !this.preCanvas) return;

		const tw = Math.max(64, Math.floor(bitmap.width * this.settings.quality));
		const th = Math.max(36, Math.floor(bitmap.height * this.settings.quality));

		if (this.canvas.width !== tw) {
			this.canvas.width = tw;
			this.canvas.height = th;
			this.preCanvas.width = tw;
			this.preCanvas.height = th;
			if (this.gl) {
				this.gl.viewport(0, 0, tw, th);
				this.gl.useProgram(this.program!);
				this.gl.uniform2f(this.uniformLocations.mainResolutionLocation, tw, th);
			}
			if (this.preGl) {
				this.preGl.viewport(0, 0, tw, th);
				const resLoc = this.preGl.getUniformLocation(this.preProgram!, "canvasRes");
				this.preGl.useProgram(this.preProgram!);
				this.preGl.uniform2f(resLoc, tw, th);
			}
		}

		const alpha = 1.0 / this.settings.smooth;

		if (this.settings.engine === "GPU" && this.gl && this.preGl && this.program && this.preProgram) {
			const gl = this.gl;
			const preGl = this.preGl;

			preGl.useProgram(this.preProgram);
			preGl.bindTexture(preGl.TEXTURE_2D, this.videoTexture);
			preGl.texImage2D(preGl.TEXTURE_2D, 0, preGl.RGB, preGl.RGB, preGl.UNSIGNED_BYTE, bitmap);
			preGl.uniform1f(this.uniformLocations.preSmoothingAlphaLocation, alpha);
			if (this.uniformLocations.preBlurAmountLocation)
				preGl.uniform2f(this.uniformLocations.preBlurAmountLocation, 0, 0);
			preGl.drawArrays(preGl.TRIANGLES, 0, 6);

			gl.useProgram(this.program);
			gl.bindTexture(gl.TEXTURE_2D, this.blurTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.preCanvas);
			gl.uniform2f(this.uniformLocations.mainBlurAmountLocation, this.settings.blur, 0);
			gl.uniform2f(this.uniformLocations.mainResolutionLocation, this.canvas.width, this.canvas.height);
			gl.uniform1f(this.uniformLocations.mainAlphaLocation, 1.0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.canvas);
			gl.uniform2f(this.uniformLocations.mainBlurAmountLocation, 0, this.settings.blur);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		} else if (this.ctx2d && this.preCtx2d) {
			if (this.settings.engine === "GPU") {
				this.settings.engine = "CPU";
				logger.warn("video-bg-renderer", "Switching to CPU mode inside render because GPU resources are missing");
			}
			const ctx2d = this.ctx2d;
			const preCtx2d = this.preCtx2d;
			preCtx2d.globalAlpha = alpha;
			preCtx2d.drawImage(bitmap, 0, 0, this.canvas.width, this.canvas.height);

			if (this.settings.blur > 0) {
				ctx2d.filter = `blur(${this.settings.blur}px)`;
			} else {
				ctx2d.filter = "none";
			}
			ctx2d.drawImage(this.preCanvas, 0, 0, this.canvas.width, this.canvas.height);
		}

		bitmap.close();
	}

	public updateSettings(settings: Partial<RenderSettings>) {
		this.settings = { ...this.settings, ...settings };
	}
}
