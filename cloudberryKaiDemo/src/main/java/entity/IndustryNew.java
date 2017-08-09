package entity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;

public class IndustryNew {
	private String title;
	private String dateline;
	private String subtitle;
	private String sectionIndex;
	private String section;
	private String sourceFile;
	private String newkeyword;

	public IndustryNew() {
	}

	public IndustryNew(JSONObject jo) throws JSONException {
		if (jo == null)
			return;
		if (jo.has("title"))
			this.setTitle(jo.getString("title").trim());
		if (jo.has("dateline")) {
			this.setDateline(jo.getString("dateline"));
			// SimpleDateFormat sdf = new SimpleDateFormat(
			// "yyyy-MM-dd hh:mm:ss.SSS ");
			// try {
			// this.setDateline(sdf.parse(jo.getString("dateline")
			// .replace("T", " ").replace("Z", " ")));
			// } catch (ParseException e) {
			// // TODO Auto-generated catch block
			// System.out.println(e.getMessage());
			// }
		}
		if (jo.has("subtitle"))
			this.setSubtitle(jo.getString("subtitle").trim());
		if (jo.has("sectionIndex"))
			this.setSectionIndex(jo.getString("sectionIndex"));
		if (jo.has("section"))
			this.setSection(jo.getString("section").trim());
		if (jo.has("sourceFile"))
			this.setSourceFile(jo.getString("sourceFile"));
		if (jo.has("newkeyword"))
			this.setNewkeyword(jo.getString("newkeyword"));
	}

	@Override
	public int hashCode() {
		return title != null ? title.hashCode() : 0;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDateline() {
		return dateline;
	}

	public void setDateline(String string) {
		this.dateline = string;
	}

	public String getSubtitle() {
		return subtitle;
	}

	public void setSubtitle(String subtitle) {
		this.subtitle = subtitle;
	}

	public String getSectionIndex() {
		return sectionIndex;
	}

	public void setSectionIndex(String sectionIndex) {
		this.sectionIndex = sectionIndex;
	}

	public String getSection() {
		return section;
	}

	public void setSection(String section) {
		this.section = section;
	}

	public String getSourceFile() {
		return sourceFile;
	}

	public void setSourceFile(String sourceFile) {
		this.sourceFile = sourceFile;
	}

	public String getNewkeyword() {
		return newkeyword;
	}

	public void setNewkeyword(String newkeyword) {
		this.newkeyword =newkeyword;
	}

}
