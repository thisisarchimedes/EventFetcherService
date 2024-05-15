import fs from 'fs';
import nock from 'nock';
import {ethers} from 'ethers';
import {Mock} from './Mock';

interface Params {
  to: string;
  data: string;
}

interface EthereumRpcRequest {
  jsonrpc: string;
  method: string;
  params: Array<Params | string>;
  id?: number | string;
}


const FUNCTION_SELECTORS = {
  asset: '0x38d52e0f',
  decimals: '0x313ce567',
  convertToAssets: '0x07a2d13a',
};
export class MockEthereumNode extends Mock {
  private baseUrl: string;
  private path: string;
  private ethCallResponse: Record<string, string> = {}; // Property to store the response of the eth_call method
  constructor(url: string) {
    super();
    const {baseUrl, path} = this.splitUrl(url);
    this.baseUrl = baseUrl;
    this.path = path;
  }

  public mockEventResponse(responsePath: string, address?: string) {
    const dataRaw = fs.readFileSync(responsePath, 'utf8');
    let mockData: ethers.providers.Log[] = JSON.parse(dataRaw);
    if (address) {
      mockData = mockData.map((log) => {
        log.address = address;
        return log;
      });
    }

    nock(this.baseUrl)
        .persist()
        .post(this.path, (body: EthereumRpcRequest) => body.method === 'eth_getLogs')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: mockData,
        }));
  }

  public mockChainId(chainId: string = '0x1') {
    nock(this.baseUrl)
        .persist()
        .post(this.path, (body: EthereumRpcRequest) => body.method === 'eth_chainId')
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: chainId,
        }));
  }

  public mockBlockNumber(blockNumber: string = '0x5B8D80') {
    nock(this.baseUrl)
        .persist()
        .post(
            this.path,
            (body: EthereumRpcRequest) => body.method === 'eth_blockNumber',
        )
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: blockNumber,
        }));
  }

  public mockGetBalance(balance: string = '0x8AC7230489E80000') {
    nock(this.baseUrl)
        .persist()
        .post(
            this.path,
            (body: EthereumRpcRequest) => body.method === 'eth_getBalance',
        )
        .reply(200, (uri: string, body: EthereumRpcRequest) => ({
          jsonrpc: '2.0',
          id: body.id,
          result: balance,
        }));
  }
  public mockEthCall() {
    nock(this.baseUrl).
        persist().
        post(this.path, (body:EthereumRpcRequest)=>body.method === 'eth_call').
        reply(200, (uri:string, requestBody:EthereumRpcRequest) => {
          let result = '0x';

          if (requestBody.params.length === 0 || typeof(requestBody.params) === 'string') return;
          switch (requestBody.params[0].data.slice(0, 10)) {
            case FUNCTION_SELECTORS.asset:
              result = this.ethCallResponse.asset;
              break;
            case FUNCTION_SELECTORS.decimals:
              result = this.ethCallResponse.decimals;
              break;
            case FUNCTION_SELECTORS.convertToAssets:
              result = this.ethCallResponse.convertToAssets;
              break;

            default:
              break;
          }
          return {
            jsonrpc: '2.0',
            id: requestBody.id,
            result: result,
          };
        });
  }
  public mockGetBlockByNumber() {
    nock(this.baseUrl).
        persist().
        post(this.path, (body:EthereumRpcRequest)=>body.method === 'eth_getBlockByNumber').
        reply(200, (uri:string, requestBody:EthereumRpcRequest) => ({
          'jsonrpc': '2.0',
          'id': 58,
          'result': {
            'number': '0x5b8d83',
            'hash': '0xac4c102e019b042ffe58ae40ed546d1721408985f8f38a6e332c1dd85531fa15',
            'transactions': [
              '0xa37028cec6808042d7a63004788000085555b8585464712107f88d3387f11fa4',
              '0x27cae936ae66b3ebf3b399c8097577c8aabaf8468017d6be300da1a33ceb7e75',
              '0xae78e9e2d6e69d1a31ab5d93dd5ea17e4b391028afdb9d3b3b084d3c7cabd7ee',
              '0xac215c155c94455bfa469ee9d2e2b8c1f73116a4ea8a9ae402d32d53fa6c5eaf',
              '0xa76e47257405ad3dae0a29b5c61d67512e6143a678430507650758cdd55daf24',
              '0x831411069dc81fbb5704c18c55cfb5581672df917cf5cab3217eb69dddd23a7a',
              '0x475a004a550a3cd1f258ddb45a7441cc3f2e440b058e5f67f05352b1f4a4e77c',
              '0xcade4d1db150e29268ebf25cc3e2a147f47a42758b5a2633f257a41df0f8b12c',
              '0x3d16f7525bdb2d82eb7db67601ea6bb4541c11a5a3b6afb50de18c255fce1683',
              '0x3a1d20141d9020aaf787a442e47b06c8ab08fa51cbdcdc8c49b674b5cd080444',
              '0x8fcdb7faa0e9ad64fe5f106122f514f404d0076210b8d0351b594fb244929626',
              '0x6c86e6790af46c412b0ac45288ea39f0273f102fe5d58e4e73bd49d9ba183661',
              '0xe705c21d2c499c5822b6716e1990ddfba4e26977b5d7af4c2c9c1b6fa5bc0660',
              '0xcbe93f28dfd3d60a21f31905aaf51f721fb58f24c80150ee3af89a66a2479c71',
              '0x12c868700f725b01c0f55028d95a49555d4438cad77881fd1fc51e1c95b358b4',
              '0xa63f3deebfdbf566a4590a9fc810bd055d76fe1569b9a725a6c126c9511901db',
              '0x08548c643af6d38c57a06c4fc2f2008312381b5fd05956409810eb21a6d43fd9',
              '0xb3a467aef20499260e8b83f6fd5abd14cafe16e01ce7c82441e7ee68dfe7d5b0',
              '0xa241aaf66010ad88b8c395fbb008f187ecec2f6ef1628bd2a169a636090f26c4',
              '0xa492a1609f249015e747fd476ba762d5c935a27970e1d708b99e9b7cd5e63db4',
              '0xfedf206b0a232db31822e713d827ef13b675b63fa991b3424be4a399ad363c75',
              '0xbc0c5ee90b9812907f085d6e85b1722a43e8a1bcc1649cab782f7388ef302ffe',
              '0xd729d2e9d176b07d034c4e8005285bd66113c30677b2fb2aec28ef1bcda30a3d',
              '0x7a82dc218f5854d0219279b03080b3914981e1282b5e3939a4c32c4097e06908',
              '0x1065c41e1e326c763a963818d38f7dd61993087bfd80fc34da5550931bd1dd9b',
              '0xd6e18c8ab45b0987841055633ffb3729d3878d44d2130205db94b3cab6bfef59',
              '0xe79b2187ea48118b8d17b7ade049c375a96e7f2c4642033f2c186173423f3543',
              '0x3b74066b52b2a94f4e32b0d57baea19fc113edcb6d6aafc4aea69acab3515ca6',
              '0x0faf042edba65673c9bf4f905b0195c24989a8f4773500d9e36a290b9d8326e6',
              '0xe0f6d8ab2d0d90aab1011a846d7bf1bf96df72bb986f5a9b1cd6696f17e69d89',
              '0x97fec96150e6231896f108c52d8926e9233a30491f8b0be2766b8a2df3fc81b7',
              '0xab8510668e99ae46476212fdf05786c67309047d2da06ea2ebb71adf31124b13',
              '0x53984443ed260d0a11e75286eaac3a57e03144eda02066e70ca0c0968356641a',
              '0xf2c5a571d316ca15879f4f300c6e758a146e9b6d369950f26a393217d94c2160',
              '0x77e40a14fa6b9cd648c7eece14f8982c63791502f2119b4213e52f774f671c93',
              '0x844bc848b888b67c6687a6992d009123955497fe206b35a91484933ab45d6e27',
              '0x9ecf23ba24958170d1f7742276a6136348cde239f70f0749c6cb8fe4a2368d44',
              '0x950fe84ec4a6d4e9311ac289bf0f2cdc510fc7ae36b7375db17e62442787c82a',
              '0x90571b871c7cd14c0ff70b845f7a1a5ebc0c9354df40b269cda0b408c5fc863a',
              '0x2d0e5c2cbba424fbdace679c26183bb242fc3900f201c89d5bdce9d3c0d0c6f2',
              '0x40d112014aa2593619a420bfc1371d6a409c305dc7307bb349cb43158d909cfb',
              '0x5e53525c3ef60388824434aeed7f140a3df1a96a8bdf1ee225b3dd99729b8a3f',
              '0xe73b8aa8a05c3ce1fd56c8a61ebded066e4b705c70c706f57163327fdbcd154a',
              '0x0f5ddd8e8f1d3cb942001c6e8d48aa186e12b919734744d31204591f7b453885',
              '0xd729ce3e04f9b1ed5a96270f225a7f25616da389034aac1231176ade02403faa',
              '0xc1309fd62bf824460c8159cff88e1739ac75c9135c0521bfaa9e5e9a84d25040',
              '0x597a13588f4ea6999214bfa705de1efe14f45cfe6d076fc7f524bc7ba785c5a2',
              '0x1fd91fb5ef3cb23db55d1805e5c088ad5d38f6471cf56c7c21affe0a42a0f2b7',
              '0x3238527dc700c7715e4e5bf202641893625379c2409b67b46686a3e838bbd5fd',
              '0xaeda5b3b15bc4643b6e28ff7cad9d8dc3cd290f7e893edc30a16e0a81b05af56',
              '0x091aaf27338b2053b58e74f2843165f66a089ce3798ec7024e6e0a15478fccba',
              '0x17e624654c2a7bf1f27ca7a9a6c85fcd9e63d9b16be3cbc88d965b28265fd5cf',
              '0xad460277021bac91aa50a89a48d10d89d20d21d370c2b2150aad8c2d901c3e12',
              '0x96f3155f474ecb39029a92b9eb082d80887806410265afd009b3d3592de50b46',
              '0x5048d4e1f57e8adb96110efc13d287b0abb4766164aeafeba3e98e532baa2a41',
              '0xa326d3e21f73914742ea4f78b907f11c8abd7bb4966082d5eb700bf7cdce10c3',
              '0xc875c7c5f616e929370f32a882b96d8aed36b63642936d56321437196cc7a120',
              '0x85f73a2f304eeef19c73545b4b4d0900c5981b5585f2449bff1f7f64ace41730',
              '0xd254b1713bdfdf17718c759c4b9ba5cb0944cd3109d61d081b5f1bf364625920',
              '0x58d30e64c226dcc06f9165f03ff1e3a65459c5e9babbef25c1df9ac2b3b2c35c',
              '0x3fe24df401636b67ecc5e759124a58ab0f65c4aecf1c605b94acc400e8fe89f7',
              '0x2b0564f86b9ff4f2964daaa762ea6acdbaaad2063022712b9cd99ed9b57b0077',
              '0x9f231a214e57a59651006818cb55c84edc2332f07b53c3151d3fe058667c4bfa',
              '0xbcdc26f272760877b172d5746810328146dcb3c1138d1ced3d0ee671120b661f',
              '0xff997180756a3e3a2f696f686cff633a30a40084953f8a6656ff83a4fc43014d',
              '0xb876757e3efc618139d2da77137eea482e27011433faf3c02813135256ae4d62',
              '0x32a3d4e8682e60c4f69bee88ed39a27ce7d45df545723a10193216a999793a06',
              '0x7c938360ef4d6d5aaff9141a4b985a1d47cf352d350b361fae9643852e0d70e3',
              '0x512703e2bc538b7e28ed4421e5a8d80da8fb911e0dc5f149d85d410d07d7925d',
              '0x674de65ee52d79ecb3f3857f8d0325b9aae2ac5f40d2beac0abedd4077e2d2a6',
              '0x07fc6281e10821eaac129849d8eed59e79ea16792e1b87f3ef16b3849aa38ee4',
              '0x221a30dc3bed1fc2faac84816a55779030e1a3ba750a78996a2133500beb149b',
              '0x5bdefccbdd5353544e81120bd316cc36503f108fedf84ca090795b6ee70c8aa8',
              '0xc61ed17af51b523495b6a88aaf1364ef9c4c7dad27df21415d1136db176385ed',
              '0xfc26b1c1f709b67bbe275a2aa04a135be5462e7288f229b1b3079244f10f3aca',
              '0xa83b254cac524a43f99b9d73df833949b2cb929a695e6bff0c3f2d89c5eda386',
              '0xa8af12d6b6a32d108e7e6e98cb0be6cf7860977675008a3de36afd3c36a8e74c',
              '0x941087287e8fe19f5ae2be9eba314368f1cb60e85db8fed9dadfd7890d5c38fd',
              '0xa79b4256ed41868eae6707e23bf09361943f383c941995848c5537bc0ac8a154',
              '0x7a47cf87ef23cf6111df98ae8c3077f9f33414b76d937072cc24586da0967869',
              '0x73649f731d07e0d832cdd1d760ea9a04ee3dc06fe8368c085585f3352b1952f5',
              '0x16a8e25b7d05a86b185a761054d47356b3fda930e405e51136cac512bb9ab728',
              '0x80ef02f2d25f83e89bd9e86cc6fdd937ea92cefe93ca16a8e2cfd490a239a7c2',
              '0xa9939da9aa3700b1ea430fafdcd7b26d0b5385d693e906a7b13bc93545187d8f',
              '0xe55e921f1033c793b34a3fc4fc77d99f369215d6ca04cbbab72dfccd28a63764',
              '0x59352fda15d035228d458dd4f1578a09d1b81eac3a46faafdb891b9a3af3d1f6',
              '0x120513e2afc883a7668e6fc9a7dbf75a03e9bbad2d0410894bef4789f0271432',
              '0x0562d4df308a8bbbbc6fd614c7f062e000fa6ffbf240569e28c3543af66c1a01',
              '0x5c119b62c604c39c09e8fc8186342d29c66f5abf862771a89a6d6d005dcfb294',
              '0x5c2499464a56a3b7fb76fd6c77ba3588a66e549c9461f1b8f61b3a27293054c6',
              '0xb6a5c87c41f5e958f312d781638f473991b6e379f805a950a4bfae96330dcd5a',
              '0xdd56f2d436e9734550a948ef8395b606ca0be1e9a92718e67eb6d1cd9469135b',
              '0x4b848e08d699e24daae63e1670eba3dcaff888f6d1ef8151bc5fa7d8a7a5dc54',
              '0xc4c02ad6c4ec840273d579c333281e6a6fad49f58f43efbe3e3e00acc4eaaf0b',
              '0x201c6abef2791a5f7682bad2d131c6ef865e13bb12fd77a5d69131202c0cd251',
              '0xef2247e5f49aeba88001854356defb0a46441e18c600c6990ae4c1a482fdfdb7',
              '0x6b7fa3cc2d0c3d25c2a00583fee45cf0679f098718cb0a57cc847905e791262d',
              '0xcaa822c75ab2e1df38acc020688d78e9d22d523ee457fdefe5fb707dc28a10bc',
              '0xdced96e770183a79d76951da4c2d304c97d7ce6bbfd1087595ab2d5cf27285a2',
              '0xe2f36fd0b03eb425c9e72bca32ace4e94b38d0dd23fe9aa73f9467f1ae830913',
              '0x58508af3653cedbd1edca08bf1db0a8c372379bf6376482ec39e6f221aaee1f2',
              '0x3fdf260c69c62d5fb0d29091b836272bcf549667a232a42bd577d42966c5e8b6',
              '0xd3b92eb60a5d285bd39b7aec5aed8cc87e9105ddfc6ca6f8bd85af8903064a2a',
              '0xf1f65bcb917b2075e31591e21365ba97c534749fcb8ca4d39291852ca239b66e',
              '0x3f717072e40b62a7a2547d2b65bc5ee57736c0e215ee1de410f1d1d7ac123535',
              '0xe82ae262d8221a51c6675456581e7899d0717d74db43de199fb3373a393a2cbe',
              '0x3e0b79d104d353045ebd31c4a7da69017629af22ff71f5b120e9637967426379',
              '0xbd096d76f1536815334ef755c7ed4128c2cea963f072ed29736a5d60ac22662d',
              '0xbbf792808a4ed75c94cc3ce8ca25dd978e498b1ca2a7565c500666361e2ccaa5',
              '0x6d31fd23b7a70ed87664653467f600040fb10fb397b72a38691f9c3b0c0ea236',
              '0x169e91ed44aed5b82d192611006ff9f332ec82cfd9b9a617eff415778a33ff32',
              '0x8e7ffaf4ecf07f77750c8bada6c8dfd55761db52dce110b71c03855564853833',
              '0x9154e173db974c0624fac5bb32f6a055a6143e53221bae82b5f1ccee2442458b',
              '0x86a984f7a755c52e81277304abc5c02ec9c6072b4cb37a628310450177db89ff',
              '0x9b53d2113358b954fb151c30275fb261739b4e60e638cbe201440402668abddc',
              '0x5fbc448a4599063d8a244c8f2fe1b881d7ae430a368062e6f742e8b4fddcd0c2',
              '0xd3303b4aee58a41a20aa53de0908d83eb069fd61735206f2990901427dbe4af0',
              '0x8de77c359c6220c059313eba82a1fb18636216558b3401bd676ed5ea852e0ea6',
              '0x9b4d4bd4db0ce3243cd920307de94012bdea25b90e5daa8cf13aac6417df3c32',
              '0xb8a157b61bbbc63b6f6b588f5dc305e3f0b03f5d1d7ec498856fc8da9e5030ea',
              '0xb156f4646038f8fea6c2be9f775404ffc9fde0ec5f2d769df94fa5baef86f7d9',
              '0xdf924e105d73ff5d408826d899b714aecf8b8b8006f34f335608a18b5986fa00',
              '0x01b9bf65a0363807e27b4f1839117d1f3a40b724aceb6f15f8c42c690e1fd2d0',
              '0x380f51de0610bb9514f417be46a0c9efcf4415f6e7742a9ae133fe2e0cdd90b8',
              '0xfd4900bba9919778cce5c651503e857b9e17c8e5e4a225e76987fa7fd76aed43',
              '0xe061c75f6ce50a233835788c99ed16266ccdf9556491f5a6259798965faf74e7',
              '0xe5f04917104afd1caaa7b4aed06f4297129dde75aa2784b44f3355b6bf43b5fe',
              '0x9eabad07feafe3369e9acb0d4d0c877963cfd57109567158442cf44a10756a14',
              '0xf8dcd2cea76b0a8a5c6c6301459c00a490eaaca525247bd9c6dd1411aca21298',
              '0x595838f2814766068778d01ba408093d99976edcaa966a128d94f42c9ce6f1ee',
              '0x40898aa1c1780ec9a2210fbad590e30dea1eb2fe3305734462df9bb3bc1dbfa2',
              '0x74dd5aeef84048b0055fc1905c5f93743555bf92bbd82bb13fc3d40fed87332f',
              '0x37dea88ee921b97d6c899c50c65f2bb85f1dc58b73b59dfb58a268066c14cba7',
              '0x81c7f2b1058da3532ecab9cd3a8ab1fcad5e8965c00edce3c71a8709366312c3',
              '0x238abc8ef87877773c706b582c1601efc0914063090001b583829b03ab69feb5',
              '0xc3e453d264bdb75e48bad9f53b6f8785c69c7bd26be1c5f4577f568d2e011422',
              '0x1582f4bb4d002f8e676e1989c1825793d04159f087e17202718e1e37f1377129',
              '0xab3aea5baea828e18d3b5f63a58c10d41d11be5bfeb10b787195953c8b41cf36',
              '0x447186e3f3b477211a67e412cdfc748b2a1d2095a79a22bb62d4af5d5bbac950',
              '0x7e14e8eb78772dd7d64eb3e080c63b6c5ed0e592b72df359f7fd6ee39062ec29',
              '0xa4f8c350f8dd627128861b95c69462d06080fcacefbfeb8411004ae20b33e1a1',
              '0x03bea9a4652d1dfcef7de04c76e17b8d59521c19c2d1f37c88fc2ea1200c4c40',
              '0x4d4f050e265fe1a500e45807956d4872360943959bbb327932857762bdc47b97',
              '0x36a76238e374702bb1eac7c8671d79bd631ae5e3aa4394497ce63a71c42ff161',
              '0x6373a94b8f4b6b8831aaff7413479d8deed5bba081b950091cf20dd707066335',
              '0x67035816d625673b39789aaaa44298fbab669119fb68ec5704956a982d914ef8',
              '0x508d36da3c1c24f424fc76608651c95e80920bc905c3996ca17813a890e53cfd',
              '0xafa7295caf3da30236a26cee0fba5afb9c67b68ec2825bc5fe3bd236217f52d3',
              '0x5af870abfbec5d9e744e3edea9ac230198832fac50283b5716e20ae647be8533',
              '0x281ecde9f25d07a7ed126171f9e2d04ae2464733d74b113ddadadf90a28ab4d0',
              '0x5f3114c91040f09c013929a8143f0735f3788194b5c53f448909e9e5eea877ec',
              '0xe483c52726dced0e1288004856f34827d69fc4411e8dc53654206be7a28b59f8',
              '0x2f1c12998c211ea20951b4ec78df22bae561eefa3c5b52c58d04d473c66e8d5c',
              '0xe33f65ec4cb6bce6c91ee3e97cfed77463c6dee895f63a484f7da4f3bde6fd87',
              '0x11f5148eaca9108898d61b12f9d337ba23589c6dca9bdb5d0427dbcb5138cbd8',
              '0x4948ebd6452ab824ff71f79c86b110a6dcf50563a02ea1a650d6af93cfb43d08',
              '0x29f2a848015c667c13d82bbdc49ba49c1c18a64dfaf49a956b62d2d4d21311e1',
              '0x252c7fc23d3566fc452791f74934581113873d54e94ae00495352ba6cfaae89f',
              '0x202b4ed15abd8900ae262871d76d426fba2a293014a36ccdeb986613a7b06db8',
              '0x16a35ef238f295134dceefd66b0c66c49f05f6ad107735cc2889f0e01ccf4b1d',
              '0x7bca437b52456d056e3b66b2a39238b455ed9a21db271074c33dec95f991d18f',
              '0xf148bc7ca05afad73c764bc7fb293c2fe8856e8f5b79f84f45fba088e24a61e8',
              '0xbd297621a3f071b92091cd44a71c026b02f0af681fe70b2f9a6c2491b4f43e72',
              '0x81c69a893f45527d6ff92a0a1d4eb8a9798ce41342f7258bf9ac408ee32d638e',
              '0x8fa3303a713c379afc2fc12a881795d5954ede7196246adbd6e524342f8265f6',
              '0x33730d53896028555b10ad95bbb103061bc2eddbf0fca2eaebd31d4241df9138',
              '0xd8dd4836760b18541e27453fc9f33562dff3ad95408067b7960fef38e4d12732',
              '0x3e28f4fe43d8961e2fec93b5d1440bc099a80121aa6238e5c3c94dd0f85a186d',
              '0xc33b4cb45f0c7ddb3fc3479e20461a5748959971c8ae04d08dc6ffc1a7b5ea0c',
              '0x512438ac1b2e7c298c8e483d5473ccee9b13d62d34da17a4404b5d1bb7dc2b79',
              '0x58e134b6997cf9de0f5e94dcc095bf5843f6d55617eebe0229ff480ec1779948',
              '0xf504125671122a2b83e0abef7919761849c0ac612d582f72192c809f7bc23090',
              '0x44880f32803e8a9d66cf6c49d13cf649c772f74acb704732ca5586e6207687af',
              '0x1c8fd5762f05ea8d4b338d498431cf0b3097ebfb86217ba731d62916c2997c5d',
              '0xc9ee1053145f586b1015442e74399d7917cc9e259ec656b8a4a4b398044f59ed',
              '0x6a5e35b4a78f9d29fca82e788db7c7bb476cd1ab15a86135f21c1d072270662b',
              '0x1324a84363271fea8c4689d9d067465ec49d8251da491144db205f9d2e513f67',
              '0x6cd159b92609159803bb83b9ac04a5e4fe28867c824a56f0218c7c84a4d8fc3d',
              '0x3316501574807aaaea092ef3f255fa7132c16af4022536188a68127b6a892fbb',
              '0xfff137aafba7529b4c3ead044b97348ba407d8f5520db21aac2636a00290c57b',
              '0x2e71bc0c48509dab16af1715847626b51f2204a3cd206bcf43dda9d7e473f1c8',
              '0x0011b84a1e2ce3e430411531beee0b2e291fd189310e483dbac58349556410e6',
              '0x8130fdae3628a205fc5c5e385673778fd5de7b616e88ac61f0d631d7428784d3',
              '0x43e5d08f7a449b883779edf496c59b01e8e118fc27445335bfcd31bb962029ae',
              '0x311de3c0ffef2a76c48d3db1d4925e75b93f019de814fbac43bace9868aab916',
              '0x0b10272dec614148ba297043ec34827f35c2c79f892a59dbf7a7f8b23c18b3d8',
              '0x29ced1f29d7d7c0f2602cd7f0c306b26b1e1e8c55c30d81720c05f7bcfcffa69',
              '0xfff91a2cd6ad61a48fb5eb7b4f6ac0ffe09126c055f083555542e77960e6bff9',
              '0x699ffbe864a4f338076c05fa9d0e21847263563593f226179b1202ec96ca800c',
              '0x87d731532a088a13d46f5bc2d8277ba5ff5687c89b3745ca48c0ed6c7004d2ce',
              '0xb81146ccfa12bf24bac2709e925597841ae9843418a7afaee39421be140d7c1c',
              '0x6ffd0331f61018fc04bb3edef1df471096d444e91b37b4cea2c4cea64473b633',
              '0x17be70920407a861837850f38cbce63ace6141e7da80141501fa04a5cc4a70fd',
              '0x53e5d7e79df7e94b034910294f2c5ab23820c40ea0586072876bf2e7a4c60de8',
              '0x08432b4320055e9bed784eba8ed46581ca401a33d1a5e9aa9012b0ed2e0b3ece',
              '0x414d19464b8892652ff41ca664f617a95c6d9a15705fde5e859c3a85e5d9bcdd',
              '0x9f8f5bef2a818bf693e88b334925ccad808590024047f23f96061a6bc15789a7',
              '0xa3f9f90012097227c86dfda7d0b5dc2677d4f878b23dc0265935d9375b6a0de1',
              '0x20dd7367cd9d3ea98ea6a889783c4fca6107c92fda99e46dc5464ba26388b4e9',
              '0xf2dec5d44f74424f4be8ce0381b12c851bba5c7f129bf3d3ce32ca68e4131a90',
            ],
            'totalDifficulty': '0x12950cf7729307a8636',
            'logsBloom': '0x06280056006a1221840010c0061040060200801088120818401801004080016890001890408420187931120010000000068016042c101104400c300300040000000480081108000184c00008012042000000000011850208801140001aa2010a00000401026021020441005340f00c45280422000000a00008044211c02031d3a00402100000330800501c04062c0008016000000020000400018040a02a050000840020022248801810400050088804605004404010800048000808000405080000100288440010411000040084008018007c1422324265202200002240680808292847000c00009040000b10408e8026001805600200902080425142900390',
            'receiptsRoot': '0x11ef0d7149881ac6f88798a6b4172cb571597a53521b87b68072e6b220430829',
            'extraData': '0x65746865726d696e652d6177732d61736961312d32',
            'nonce': '0xaaa53a2cf1a63c06',
            'miner': '0xea674fdde714fd979de3edf0f56aa9716b898ec8',
            'difficulty': '0xc5d599778bd91',
            'gasLimit': '0x7a121d',
            'gasUsed': '0x7a0e64',
            'uncles': [],
            'sha3Uncles': '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
            'size': '0x66ab',
            'transactionsRoot': '0x2f3e9986560ad42636a10fc84e44eb1fa5b913296b178e8d8ddbaeafd1ed3576',
            'stateRoot': '0x1b805c59b2f0dcf8510e2a8a0fae44abd48392ce431aef26ac1d25ca535cc046',
            'mixHash': '0x88c9d5075104c09ee2a3807fe24fbc03dafd1faf91ed96f515dcaa97c7e64ad8',
            'parentHash': '0x6b855d4ca375a859bb00ee9a70b0e51bcefac0b075e5855a39bc9e361005af89',
            'timestamp': '0x5b524668',
          },
        }));
  }

  public setValueForETHCall(key:string, value:string) {
    this.ethCallResponse[key] = value;
  }

  public cleanup() {
    nock.cleanAll();
  }


  private splitUrl(urlString: string): { baseUrl: string, path: string } {
    try {
      const url = new URL(urlString);
      return {
        baseUrl: `${url.protocol}//${url.host}`,
        path: `${url.pathname}${url.search}${url.hash}`,
      };
    } catch (error) {
      throw new Error('Invalid URL provided');
    }
  }
}
