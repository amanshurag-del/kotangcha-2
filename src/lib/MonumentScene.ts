import * as THREE from 'three';
import { MemoryEntry } from '../types';

export class MonumentScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public flag: THREE.Mesh | null = null;
  public pole: THREE.Mesh | null = null;
  public offeringMeshes: THREE.Mesh[] = [];
  public structureMeshes: THREE.Mesh[] = [];
  public meshToMemory = new Map<THREE.Mesh, MemoryEntry>();
  
  private targetVector = new THREE.Vector3(0, 5, 0);
  private animTime = 0;
  private ft = 0;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(10, 8, 14);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xfaf9f7, 0);

    this.setupLighting();
    this.buildStructure();
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xfcfaf7, 0.9));
    const sun = new THREE.DirectionalLight(0xfffdfa, 0.6);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = 4096;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -10;
    sun.shadow.camera.right = sun.shadow.camera.top = 10;
    this.scene.add(sun);
    
    const rim = new THREE.DirectionalLight(0xffffff, 0.2);
    rim.position.set(-10, 10, -10);
    this.scene.add(rim);
  }

  private buildStructure() {
    const st1 = this.stoneTex(42, 42, 22, 62); st1.repeat.set(2, 2);
    const st2 = this.stoneTex(77, 40, 18, 58); st2.repeat.set(1.5, 1.5);
    const matStone1 = new THREE.MeshLambertMaterial({ map: st1 });
    const matStone2 = new THREE.MeshLambertMaterial({ map: st2 });
    const matSlab = new THREE.MeshLambertMaterial({ color: 0x5a5e62 });

    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      this.structureMeshes.push(m);
      return m;
    };

    // Tier 1: Base
    box(4.8, 2.6, 4.8, matStone1, 0, 1.3, 0);
    box(5.4, 0.18, 5.4, matSlab, 0, 2.69, 0);

    // Tier 2
    box(3.4, 2.4, 3.4, matStone2, 0, 4.0, 0);
    box(4.0, 0.18, 4.0, matSlab, 0, 5.28, 0);

    // Tier 3
    box(2.2, 2.0, 2.2, matStone1, 0, 6.37, 0);
    box(2.8, 0.18, 2.8, matSlab, 0, 7.46, 0);

    // Tier 4 (Top Cap)
    box(1.6, 0.8, 1.6, matStone2, 0, 7.94, 0);
    box(2.0, 0.14, 2.0, matSlab, 0, 8.41, 0);

    // Pole
    this.pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 4.5, 8), new THREE.MeshLambertMaterial({ color: 0x3d352a }));
    this.pole.position.set(0, 10.65, 0);
    this.pole.castShadow = true;
    this.scene.add(this.pole);
    this.structureMeshes.push(this.pole);

    // Flag
    const pfTex = this.prayerFlagTex();
    const flagGeo = new THREE.PlaneGeometry(0.55, 2.8, 8, 12);
    const flagMat = new THREE.MeshLambertMaterial({ 
      map: pfTex,
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.96
    });
    this.flag = new THREE.Mesh(flagGeo, flagMat);
    this.flag.position.set(0.28, 11.4, 0);
    this.scene.add(this.flag);
    this.structureMeshes.push(this.flag);
  }

  public updateOfferings(memories: MemoryEntry[]) {
    // Clear existing
    this.offeringMeshes.forEach(m => this.scene.remove(m));
    this.offeringMeshes = [];
    this.meshToMemory.clear();

    // Earthy Palette
    const mTerracotta = new THREE.MeshLambertMaterial({ color: 0xac6d47 });
    const mBronze = new THREE.MeshLambertMaterial({ color: 0x765a36 });
    const mSlate = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const mOchre = new THREE.MeshLambertMaterial({ color: 0xc8972a });
    const mMoss = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    const mWood = new THREE.MeshLambertMaterial({ color: 0x5d4a36 });
    const mPaper = new THREE.MeshLambertMaterial({ color: 0xe8dfc8 });
    const mGlass = new THREE.MeshLambertMaterial({ color: 0x9ab8c8, transparent: true, opacity: 0.6 });
    const mFlower = new THREE.MeshLambertMaterial({ color: 0xd44a4a });
    const mStone = new THREE.MeshLambertMaterial({ color: 0x9a9690 });

    const SLOTS = [
      // Tier 1 (Base)
      { x: -2.3, y: 2.78, z: 2.3, type: 'pot' },
      { x: -1.2, y: 2.82, z: 2.4, type: 'vessel' },
      { x: 0, y: 2.78, z: 2.6, type: 'stone' },
      { x: 1.2, y: 2.82, z: 2.4, type: 'stone' },
      { x: 2.3, y: 2.78, z: 2.3, type: 'bowl' },
      { x: 2.5, y: 2.78, z: 1.0, type: 'vessel' },
      { x: 2.6, y: 2.78, z: 0, type: 'scroll' },
      { x: 2.5, y: 2.78, z: -1.0, type: 'bottle' },
      { x: 2.3, y: 2.78, z: -2.3, type: 'pot' },
      { x: 1.2, y: 2.78, z: -2.5, type: 'flower' },
      { x: 0, y: 2.82, z: -2.6, type: 'stone' },
      { x: -1.2, y: 2.78, z: -2.5, type: 'scroll' },
      { x: -2.3, y: 2.78, z: -2.3, type: 'vessel' },
      { x: -2.6, y: 2.78, z: 0, type: 'bottle' },
      { x: -2.5, y: 2.78, z: 1.2, type: 'stone' },

      // Tier 2
      { x: -1.7, y: 5.37, z: 1.7, type: 'bowl' },
      { x: -0.5, y: 5.37, z: 1.8, type: 'pot' },
      { x: 0.8, y: 5.37, z: 1.8, type: 'vessel' },
      { x: 1.7, y: 5.37, z: 1.0, type: 'stone' },
      { x: 1.8, y: 5.37, z: 0, type: 'scroll' },
      { x: 1.7, y: 5.37, z: -1.0, type: 'stone' },
      { x: 0.5, y: 5.37, z: -1.8, type: 'bottle' },
      { x: -0.8, y: 5.37, z: -1.8, type: 'stone' },
      { x: -1.7, y: 5.37, z: -1.0, type: 'flower' },
      { x: -1.8, y: 5.37, z: 0, type: 'vessel' },

      // Tier 3
      { x: -1.1, y: 7.55, z: 1.1, type: 'stone' },
      { x: 0, y: 7.55, z: 1.2, type: 'pot' },
      { x: 1.1, y: 7.55, z: 1.1, type: 'vessel' },
      { x: 1.2, y: 7.55, z: 0, type: 'stone' },
      { x: 0, y: 7.55, z: -1.2, type: 'scroll' },
      { x: -1.2, y: 7.55, z: 0, type: 'stone' },

      // Tier 4
      { x: 0.8, y: 8.48, z: 0.8, type: 'stone' },
      { x: -0.8, y: 8.48, z: -0.8, type: 'bowl' },
      { x: 0, y: 8.48, z: 0.9, type: 'vessel' },
    ];

    // Show memories first, then fill with placeholder objects if requested for visual representation
    const visualTotalCount = 35; // Ensure at least 35 items for visual representation
    const displayCount = Math.min(SLOTS.length, Math.max(memories.length, visualTotalCount));

    for (let i = 0; i < displayCount; i++) {
      const slot = SLOTS[i];
      
      let geo: THREE.BufferGeometry;
      let mat: THREE.Material;

      switch (slot.type) {
        case 'pot': geo = new THREE.CylinderGeometry(0.12, 0.17, 0.28, 16); mat = mTerracotta; break;
        case 'vessel': geo = new THREE.CylinderGeometry(0.09, 0.12, 0.22, 12); mat = mBronze; break;
        case 'scroll': geo = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 10); mat = mPaper; break;
        case 'bowl': geo = new THREE.CylinderGeometry(0.14, 0.1, 0.1, 16); mat = mWood; break;
        case 'bottle': geo = new THREE.CylinderGeometry(0.07, 0.09, 0.24, 10); mat = mGlass; break;
        case 'flower': geo = new THREE.SphereGeometry(0.07, 8, 6); mat = mFlower; break;
        case 'stone': 
          geo = new THREE.SphereGeometry(0.08 + (i % 3) * 0.015, 10, 8); 
          mat = (i % 2 === 0) ? mSlate : mStone; 
          break;
        default: geo = new THREE.SphereGeometry(0.08, 10, 8); mat = mMoss;
      }

      const m = new THREE.Mesh(geo, mat);
      m.position.set(slot.x, slot.y, slot.z);
      if (slot.type === 'scroll') m.rotation.z = Math.PI / 2;
      m.castShadow = m.receiveShadow = true;
      this.scene.add(m);
      this.offeringMeshes.push(m);
      
      if (i < memories.length) {
        this.meshToMemory.set(m, memories[i]);
      } else {
        // Mark as placeholder for custom styling or behavior if needed
        m.userData.isPlaceholder = true;
      }
    }
  }

  public update(theta: number, phi: number, radius: number, autoRotate: boolean) {
    this.animTime += 0.008;
    this.ft += 0.035;

    // Remove floating movement as requested by "remove this" in monument area
    this.targetVector.y = 5;

    this.camera.position.set(
      this.targetVector.x + radius * Math.sin(phi) * Math.sin(theta),
      this.targetVector.y + radius * Math.cos(phi),
      this.targetVector.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(this.targetVector);

    if (this.flag) {
      this.flag.rotation.y = Math.sin(this.ft * 0.5) * 0.08;
      const pos = this.flag.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const wave = Math.sin(this.ft * 1.5 + y * 2) * (x + 0.3) * 0.12;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private stoneTex(seed: number, bH: number, bS: number, bL: number) {
    const sz = 1024;
    const cv = document.createElement('canvas');
    cv.width = cv.height = sz;
    const ctx = cv.getContext('2d', { alpha: false })!;
    const rng = (s: number) => {
      let x = Math.sin(s + 1) * 10000;
      return x - Math.floor(x);
    };
    ctx.fillStyle = `hsl(${bH},${bS}%,${bL}%)`;
    ctx.fillRect(0, 0, sz, sz);
    let y = 0, row = 0;
    while (y < sz) {
      const rh = (18 + rng(seed + row) * 10) * 4;
      ctx.fillStyle = `hsl(${bH},${Math.max(0, bS - 15)}%,${Math.max(20, bL - 18)}%)`;
      ctx.fillRect(0, y, sz, 4);
      let x = rng(seed + row * 100) * 80;
      let col = 0;
      while (x < sz) {
        const sw = (28 + rng(seed + row * 100 + col) * 28) * 4;
        ctx.fillStyle = `hsl(${bH},${Math.max(0, bS - 12)}%,${Math.max(20, bL - 14)}%)`;
        ctx.fillRect(x, y + 4, 3, rh - 4);
        const l2 = bL + (rng(seed + row + col + 1) - 0.5) * 16;
        ctx.fillStyle = `hsl(${bH + rng(seed + row + col) * 8 - 4},${bS}%,${l2}%)`;
        ctx.fillRect(x + 3, y + 4, sw - 3, rh - 4);
        x += sw; col++;
      }
      y += rh; row++;
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  private prayerFlagTex() {
    const w = 512, h = 2560;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const segH = h / 5;
    for (let i = 0; i < 5; i++) {
      const yOff = i * segH;
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, yOff + 16, w - 32, segH - 32);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      const cx = w/2, cy = yOff + segH/2;
      ctx.fillRect(cx - 2, cy - 40, 4, 80);
      ctx.fillRect(cx - 40, cy - 2, 80, 4);
    }
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return t;
  }
}
