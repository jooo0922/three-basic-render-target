'use strict';

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // 렌더 타겟을 만들어서 직접 렌더링한 텍스쳐를 큐브 메쉬에 입혀보기
  const rtWidth = 512;
  const rtHeight = 512;
  const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

  // 렌더 타겟에 넣어줄 렌더 씬과 그거를 찍어줄 렌더 카메라도 따로 생성해줘야 함.
  const rtFov = 75;
  const rtAspect = rtWidth / rtHeight;
  // 렌더 타겟에 넣어줄 씬을 찍는 렌더 타겟 카메라의 aspect는 렌더 타겟의 가로세로비로 할당해줘야 함.
  // 왜냐? 이 카메라는 지금 canvas를 찍어주는 게 아니고, 렌더 타겟에 들어갈 씬을 찍어주는거지?
  // 그러면 렌더 타겟 사이즈에 맞춰서 카메라 비율을 조정해줘야겠지?
  // 근데 렌더 타겟도 결국 렌더 타겟을 텍스쳐로 사용하는 물체의 가로 세로 비율에 맞출 필요도 있어.
  // 그럼 이 렌더 타겟을 텍스쳐로 사용하는 물체는 정육면체니까! 정육면체는 가로세로비가 1.0이지?
  // 그래서 결국 렌더 타겟을 찍는 데 필요한 카메라는 렌더 타겟을 텍스쳐로 사용하는 물체의 가로세로비를 aspect값으로 할당해줘야 함.
  const rtNear = 0.1;
  const rtFar = 5;
  const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
  rtCamera.position.z = 2;

  const rtScene = new THREE.Scene();
  rtScene.background = new THREE.Color('red');

  // 렌더 타겟의 씬에서 사용할 조명을 추가로 생성함
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    rtScene.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    rtScene.add(cube);

    cube.position.x = x;

    return cube;
  }

  // 렌더 타겟의 씬에서 사용할 정육면체 3개를 추가로 생성함
  const rtCubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  // 이전 글에서 사용했던 Camera는 그대로 둠. canvas를 렌더링할 때 사용해야 함.
  const fov = 75;
  const aspect = 2 // 캔버스의 가로 / 세로 비율. 캔버스의 기본 크기가 300 * 150이므로 캔버스 기본 비율과 동일하게 설정한 셈.
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  // 이전 글에서 사용했던 Scene도 그대로 둠. canvas를 렌더링할 때 사용해야 함.
  const scene = new THREE.Scene();

  // 이전 글에서 사용했던 Light도 그대로 둠. canvas를 렌더링할 때 사용해야 함.
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // 렌더 타겟를 텍스쳐로 사용할 정육면체를 추가로 생성해 줌.
  const material = new THREE.MeshPhongMaterial({
    map: renderTarget.texture
  }); // 퐁-머티리얼을 따로 생성하는 이유는, makeInstance안에서 사용하는 퐁-머티리얼은 그냥 컬러값만 지정해주는 거고,
  // 여기서 사용하는 퐁-머티리얼에서는 렌더 타겟을 텍스쳐로 사용하기 때문에, 엄연히 다른 퐁-머티리얼임. 그래서 따로 만들어준 것.
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube); // 렌더 타겟 씬에 필요한 게 아니라, 실제 캔버스에 렌더되는 물체니까 그냥 scene에다 추가해줘야지

  /**
   * three.js에서 레티나 디스플레이를 다루는 방법
   * (공식 문서에는 HD-DPI를 다루는 법이라고 나와있음.)
   * 
   * renderer.setPixelRatio(window.devicePixelRatio);
   * 
   * 위에 메소드를 사용해서 캔버스의 픽셀 사이즈를 CSS 사이즈에 맟출수도 있지만, 
   * 공식 문서에서는 추천하지 않는다고 함.
   * 
   * 그냥 아래와 같이 pixelRatio값을 직접 구한 뒤에 clientWidth,Height에 곱해주는 게 훨씬 낫다고 함.
   * 원래 2d canvas에 할때도 이렇게 했으니 하던대로 하면 될 듯.
   * 
   * 자세한 내용은 공식 문서 참고...
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;

    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function animate(t) {
    // 타임스탬프 값이 16.~~ms 이런식으로 밀리세컨드 단위로 리턴받는거를 0.016~~s의 세컨드 단위로 변환하려는 거.
    // 이제 매 프레임마다 갱신되는 세컨드 단위의 타임스탬프 값만큼 해당 mesh의 x축과 y축을 회전시키겠다는 거임.
    t *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // 먼저 렌더 타겟 씬 안에 있는 정육면체 3개를 각각 회전시킴.
    rtCubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = t * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    /**
     * WebGLRenderer.setRenderTarget(renderTarget)
     * 
     * 이거는 뭐냐면 현재 캔버스를 담고있는 WebGLRenderer에게 활성화해야 하는 렌더 타겟을 지정하는 메소드임.
     * 파라미터 자리에 어떤 렌더 타겟을 생성해서 전달해준 뒤,
     * render() 메소드에 렌더 타겟 씬, 렌더 타겟 카메라로 사용할 요소들을 전달해주면 
     * WebGLRenderer는 렌더 타겟 씬 안의 요소들을 계산하여 렌더링해줌.
     * 
     * 반면에 파라미터 자리에 null값을 넣으면,
     * '활성화해야 하는 렌더 타겟이 없다(null)'는 뜻으로 인식을 하기 때문에
     * 렌더러는 원래대로 캔버스를 활성화할 렌더 대상으로 설정함.
     */
    renderer.setRenderTarget(renderTarget);
    renderer.render(rtScene, rtCamera);
    renderer.setRenderTarget(null);

    // 원래 씬 안에 생성해놓은, 렌더 타겟을 텍스쳐로 사용하는 정육면체를 회전시킴.
    cube.rotation.x = t;
    cube.rotation.y = t * 1.1;

    // 위에서 활성 렌더 대상을 캔버스로 미리 다시 복구시켜놨기 때문에
    // 렌더 타겟을 텍스쳐로 사용하는 정육면체의 회전 애니메이션을 캔버스에 렌더링함.
    renderer.render(scene, camera);

    requestAnimationFrame(animate);

    /**
     * 렌더 타겟 사용 시 애니메이션 걸어주는 순서
     * 
     * 1. 렌더 타겟 씬 안의 물체들의 애니메이션을 먼저 계산해준 뒤,
     * 활성 렌더 대상을 렌더 타겟으로 바꾼 다음,
     * 렌더 타겟 씬, 렌더 타겟 카메라를 render() 메소드로 전달해서 
     * 렌더 타겟 씬안의 장면을 렌더 타겟에 렌더해주는 걸 먼저 끝내줌.
     * 
     * 2. 그러고 나서 활성 렌더 대상을 다시 캔버스로 원상복구 시킨 뒤,
     * 원래의 씬 안의 물체들(이들 중 렌더 타겟을 텍스쳐로 사용하는 물체들이 포함되어 있음.)의 애니메이션을 계산해주고,
     * 원래의 씬, 원래의 카메라를 render() 메소드로 전달해서 캔버스에 렌더링을 해줌.
     * 
     * 3. 마지막으로 requestAnimationFrame(animate)로 애니메이션 메소드를 반복호출 해줌.
     */
  }

  requestAnimationFrame(animate);
}

main();