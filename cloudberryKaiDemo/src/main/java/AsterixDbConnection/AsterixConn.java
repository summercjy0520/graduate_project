package AsterixDbConnection;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.logging.Level;

import org.apache.asterix.common.config.GlobalConfig;
import org.apache.commons.httpclient.DefaultHttpMethodRetryHandler;
import org.apache.commons.httpclient.HostConfiguration;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpException;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.commons.httpclient.params.HttpClientParams;
import org.apache.commons.httpclient.params.HttpMethodParams;
import org.json.JSONObject;

/**
 * @author michael
 */
public class AsterixConn {
	private static HttpClient client = new HttpClient();

	public AsterixConn(HostConfiguration hc, HttpClientParams params) {
		client.setHostConfiguration(hc);
		client.setParams(params);
	}

	/**
	 * usage:
	 * String ret = new AsterixConn().handleRequest(new AsterixConf().setDataverse("x3b").setBody("for ..."),
	 * AsterixConf.OpType.QUERY);
	 */
	public AsterixConn() {

	}

	@SuppressWarnings("unused")
	private static InputStream executeHttpMethod(HttpMethod method) {
		// HttpClient client = new HttpClient();
		try {
			int statusCodes = client.executeMethod(method);
			if (statusCodes != HttpStatus.SC_OK) {
				GlobalConfig.ASTERIX_LOGGER.log(Level.SEVERE, "Method failed: "
						+ method.getStatusCode());
			}
			return method.getResponseBodyAsStream();
		} catch (Exception e) {
			GlobalConfig.ASTERIX_LOGGER.log(Level.SEVERE, e.getMessage(), e);
			e.printStackTrace();
		}
		return null;
	}

	public String[] handleError(HttpMethod method) throws Exception {
		String errorBody = method.getResponseBodyAsString();
		JSONObject result = new JSONObject(errorBody);

		String[] errors = { result.getJSONArray("error-code").getString(0),
				result.getString("summary"), result.getString("stacktrace") };
		return errors;
	}

	private String processDDL(AsterixConf conf, AsterixConf.OpType type,
			String reqStr) throws Exception {
		PostMethod post = new PostMethod(conf.getUrl(type));
		post.setRequestEntity(new StringRequestEntity(reqStr));
		// post.setRequestEntity(new MultipartRequestEntity(new Part[] { new StringPart("query", reqStr),
		// new StringPart("mode", "asynchronous")}, new HttpMethodParams()));
		post.getParams().setParameter(HttpMethodParams.RETRY_HANDLER,
				new DefaultHttpMethodRetryHandler(3, false));

		int ret = HttpStatus.SC_OK;
		String result = "";
		try {
			ret = client.executeMethod(post);
			InputStream is = post.getResponseBodyAsStream();
			if (is != null) {
				BufferedReader in = new BufferedReader(
						new InputStreamReader(is));
				String line;
				StringBuilder sb = new StringBuilder();
				while ((line = in.readLine()) != null) {
					sb.append(line);
				}
				result = sb.toString();
			}
		} catch (HttpException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		if (HttpStatus.SC_OK != ret) {
			GlobalConfig.ASTERIX_LOGGER.log(Level.SEVERE, "Method failed: "
					+ post.getStatusCode());
			String[] errors = null;
			try {
				errors = handleError(post);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println(result);
				e.printStackTrace();
			}
			GlobalConfig.ASTERIX_LOGGER.log(Level.SEVERE, errors[2]);
			return ("DDL operation failed: " + errors[0] + "\nSUMMARY: "
					+ errors[1] + "\nSTACKTRACE: " + errors[2]);
		}
		if (!"".equals(result))
			return result;
		else
			return "do successfully";
	}

	/**
	 * send request according to AsterixConf, mode == synchornous
	 * 
	 * @param conf
	 * @param type
	 * @return
	 * @throws Exception
	 */
	public String handleRequest(AsterixConf conf, AsterixConf.OpType type)
			throws Exception {
		String ret = null;
		String reqStr = conf.getQuery();
		if ("".equals(reqStr))
			throw new Exception("can't build query from AsterixConf.");
		switch (type) {
		case DDL:
			ret = processDDL(conf, type, reqStr);
			break;
		case INSERT:
			ret = processDDL(conf, type, reqStr);
			break;
		case DELETE:
			ret = processDDL(conf, type, reqStr);
			break;
		case LOAD:
			ret = processDDL(conf, type, reqStr);
			break;
		case QUERY:
			ret = processDDL(conf, type, reqStr);
			break;
		case UPDATE:
			break;
		case RESULT:
			ret = processDDL(conf, type, reqStr);
			break;
		case AQL:
			ret = processDDL(conf, type, reqStr);
		default:
			break;
		}
		return ret;
	}

//	public static void main(String arg[]) throws Exception {
//		AsterixConf aconf = new AsterixConf("http://172.16.132.48:19002")
//				.setDataverse("x3b");
//		aconf.setBody("for $a in dataset companies where $a.brief.name = \"中科软科技股份有限公司\" limit 1 return $a.brief.name ");
//		String ret = new AsterixConn().handleRequest(aconf,
//				AsterixConf.OpType.QUERY);
//		System.out.println(ret);
//	}
}