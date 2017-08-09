package controller;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

// @SpringBootApplication
@Configuration
@EnableAutoConfiguration
@ComponentScan
@Controller
public class ApplicationRunner {

	/**
	 * 主页
	 * 
	 * @param model
	 * @return
	 */
	@RequestMapping("/cloudberry")
	public String cloudberry(Model model) {
		// model.addAttribute("name", "");
		return "cloudberry";
	}

	/**
	 * 程序启动入口
	 * @param args
	 */
	public static void main(String[] args) {
		SpringApplication.run(ApplicationRunner.class, args);
	}
}
